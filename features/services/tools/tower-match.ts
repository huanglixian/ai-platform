import { tool } from "ai";
import { z } from "zod";

export const towerMatchSearch = tool({
  description: "根据输电线路设计条件搜索和匹配可用杆塔方案。",
  inputSchema: z.object({
    towerType: z.enum(["悬垂塔", "耐张塔"]).describe("杆塔类型：悬垂塔 / 耐张塔"),
    voltageClass: z.string().describe("电压等级，例如 500kV, 220kV"),
    loopNum: z.string().describe("回路数，必须是字符串格式的数字，例如 '2'"),
    splitNum: z.string().describe("分裂数，必须是字符串格式的数字，例如 '4'"),
    crossSection: z.string().describe("截面面积，必须是字符串格式的数字，例如 '500'"),
    maxWindSpeed: z.string().describe("最大风速，单位 m/s，必须是字符串格式的数字，例如 '40'"),
    iceThickness: z.string().describe("覆冰厚度，单位 mm，必须是字符串格式的数字，例如 '0'"),
    towerMaterial: z.enum(["1", "2", "3"]).describe("杆塔材质：'1'=钢管，'2'=单角钢，'3'=双角钢"),
    expectedHeight: z.string().describe("预测呼高，必须是字符串格式的数字，例如 '33'"),
    horizontalSpan: z.string().describe("水平档距，必须是字符串格式的数字，例如 '500'"),
    maxAngle: z.string().describe("最大转角，必须是字符串格式的数字，例如 '0'"),
  }),
  execute: async (input) => {
    const startTime = Date.now();
    try {
      const endpoint = process.env.TOWER_MATCH_API_URL;
      const apiKey = process.env.TOWER_MATCH_API_KEY;
      if (!endpoint || !apiKey) throw new Error("杆塔匹配服务未配置");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`API 响应错误: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        elapsedMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知请求错误",
        elapsedMs: Date.now() - startTime,
      };
    }
  },
});
