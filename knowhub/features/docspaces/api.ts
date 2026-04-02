import type {
  CreateDocSpaceInput,
  DocSpaceFileSnapshot,
  DocSpaceRecord,
  TestDocSpaceConnectionInput,
  TestDocSpaceConnectionResult,
} from "@/knowhub/features/docspaces/types";

type ApiResponse<T> = T & {
  ok: boolean;
  error?: string;
};

async function fetchDocSpaceApi<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/knowhub/docspaces${path}`, {
    ...init,
    cache: "no-store",
  });

  let data: ApiResponse<T>;

  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("响应格式不正确");
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `请求失败：${response.status}`);
  }

  return data;
}

export async function listDocSpacesApi() {
  const data = await fetchDocSpaceApi<{ items: DocSpaceRecord[] }>("");
  return data.items;
}

export async function createDocSpaceApi(payload: CreateDocSpaceInput) {
  const data = await fetchDocSpaceApi<{ item: DocSpaceRecord }>("", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return data.item;
}

export async function getDocSpaceApi(id: string) {
  const data = await fetchDocSpaceApi<{ item: DocSpaceRecord }>(
    `/${encodeURIComponent(id)}`,
  );
  return data.item;
}

export async function deleteDocSpaceApi(id: string) {
  const data = await fetchDocSpaceApi<{ item: DocSpaceRecord }>(
    `/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );

  return data.item;
}

export async function uploadDocSpaceFilesApi(id: string, files: File[]) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const data = await fetchDocSpaceApi<{ item: DocSpaceRecord }>(
    `/${encodeURIComponent(id)}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  return data.item;
}

export async function listDocSpaceFilesApi(id: string) {
  const data = await fetchDocSpaceApi<{ items: DocSpaceFileSnapshot[] }>(
    `/${encodeURIComponent(id)}/files`,
  );
  return data.items;
}

export async function syncDocSpaceApi(id: string) {
  const data = await fetchDocSpaceApi<{ item: DocSpaceRecord }>(
    `/${encodeURIComponent(id)}/sync`,
    {
      method: "POST",
    },
  );

  return data.item;
}

export async function testDocSpaceConnectionApi(
  payload: TestDocSpaceConnectionInput,
) {
  const data = await fetchDocSpaceApi<{ result: TestDocSpaceConnectionResult }>(
    "/test-connection",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  return data.result;
}
