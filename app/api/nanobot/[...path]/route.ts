import { NextRequest, NextResponse } from "next/server";

const defaultNanobotServer = "http://127.0.0.1:18791";

function buildTargetUrl(path: string[], request: NextRequest) {
  const baseUrl = (
    process.env.NANOBOT_SERVER_BASE_URL || defaultNanobotServer
  ).replace(/\/+$/, "");
  const pathname = path.map(encodeURIComponent).join("/");
  const search = request.nextUrl.search || "";
  return `${baseUrl}/api/${pathname}${search}`;
}

async function proxyRequest(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path, request);
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  try {
    const requestBody =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text();
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: requestBody,
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    const responseCacheControl = response.headers.get("cache-control");

    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType);
    }
    if (responseCacheControl) {
      responseHeaders.set("cache-control", responseCacheControl);
    }
    if (responseContentType?.includes("text/event-stream")) {
      responseHeaders.set("x-accel-buffering", "no");
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: `无法连接 nanobot_web_server，请确认 ${defaultNanobotServer} 已启动`,
      },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  return proxyRequest(request, context);
}
