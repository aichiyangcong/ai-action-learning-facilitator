import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import pg from "pg";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/evaluate-topic", async (req, res) => {
    try {
      const { title, background, painPoints, triedActions } = req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `你是一位行动学习催化师AI助手。请评估用户提交的课题质量。

请严格按照以下JSON格式返回评估结果，不要添加任何额外文字：
{
  "totalScore": <1-10的整数>,
  "dimensions": {
    "focus": <1-10>,
    "resultOriented": <1-10>,
    "singleIssue": <1-10>,
    "uncertainty": <1-10>,
    "controllability": <1-10>,
    "learning": <1-10>
  },
  "suggestions": ["建议1", "建议2", "建议3"],
  "examples": [
    {"title": "示例课题1", "description": "简短描述"},
    {"title": "示例课题2", "description": "简短描述"},
    {"title": "示例课题3", "description": "简短描述"}
  ]
}

评估维度说明：
- focus(聚焦性): 课题是否足够具体聚焦
- resultOriented(结果导向): 是否有明确期望的结果
- singleIssue(单一议题): 是否聚焦在一个核心问题上
- uncertainty(未知性): 是否存在需要探索的未知领域
- controllability(可控性): 案主是否有能力影响结果
- learning(学习性): 是否有学习和成长的空间`,
          },
          {
            role: "user",
            content: `课题名称：${title}\n背景现状：${background}\n核心痛点：${painPoints}\n已尝试行动：${triedActions}`,
          },
        ],
        stream: true,
        max_completion_tokens: 8192,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Error evaluating topic:", error);
      if (res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ error: "Failed to evaluate topic" })}\n\n`,
        );
        res.end();
      } else {
        res.status(500).json({ error: "Failed to evaluate topic" });
      }
    }
  });

  app.post("/api/pre-mortem", async (req, res) => {
    try {
      const { topic } = req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `你是一位行动学习催化师AI助手，擅长进行"事前验尸"分析。

请基于用户提交的课题，进行风险预警分析。严格按照以下JSON格式返回：
{
  "warning": "一段200字左右的风险预警描述，描述如果延续当前策略，可能面临的最坏结果",
  "riskFactors": ["风险因素1", "风险因素2", "风险因素3"],
  "focusAreas": ["建议研讨重点关注领域1", "建议研讨重点关注领域2"]
}`,
          },
          {
            role: "user",
            content: `课题：${topic.title}\n背景：${topic.background}\n痛点：${topic.painPoints}`,
          },
        ],
        stream: true,
        max_completion_tokens: 8192,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Error generating pre-mortem:", error);
      if (res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ error: "Failed to generate pre-mortem" })}\n\n`,
        );
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate pre-mortem" });
      }
    }
  });

  app.post("/api/classify-question", async (req, res) => {
    try {
      const { question, topicContext } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `你是一位行动学习催化师AI助手。请将提问分类到5F维度中的一个。

5F维度：
- fact(事实类): 关于客观数据、事实信息的提问
- feeling(感受类): 关于情感、感受、体验的提问
- finding(分析类): 关于原因分析、深层思考的提问
- future(行动类): 关于未来行动、解决方案的提问
- focus(聚焦类): 帮助聚焦核心问题的提问

同时判断提问质量，如果是封闭式提问，给出开放式改写建议。

严格按以下JSON格式返回：
{
  "category": "fact|feeling|finding|future|focus",
  "categoryLabel": "事实类|感受类|分析类|行动类|聚焦类",
  "isClosed": true/false,
  "suggestion": "如果是封闭式提问，给出改写建议，否则为null"
}`,
          },
          {
            role: "user",
            content: `课题背景：${topicContext}\n提问：${question}`,
          },
        ],
        max_completion_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content || "{}";
      res.json(JSON.parse(content));
    } catch (error) {
      console.error("Error classifying question:", error);
      res.status(500).json({ error: "Failed to classify question" });
    }
  });

  app.post("/api/shadow-questions", async (req, res) => {
    try {
      const { topicContext, radarData, existingQuestions } = req.body;

      const missingDimensions = Object.entries(radarData || {})
        .filter(([, value]) => (value as number) < 2)
        .map(([key]) => key);

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `你是一位行动学习催化师AI助手。团队提问风暴中检测到某些维度严重缺失，请针对缺失维度生成2-3个高质量的补充提问（影子提问）。

缺失维度：${missingDimensions.join(", ")}

维度说明：
- fact(事实类): 关于客观数据、事实信息
- feeling(感受类): 关于情感、感受、体验
- finding(分析类): 关于原因分析、深层思考
- future(行动类): 关于未来行动、解决方案
- focus(聚焦类): 帮助聚焦核心问题

严格按以下JSON格式返回：
{
  "missingAlert": "一句话描述检测到的盲区",
  "questions": [
    {"text": "提问内容", "category": "维度英文", "categoryLabel": "维度中文"},
    {"text": "提问内容", "category": "维度英文", "categoryLabel": "维度中文"},
    {"text": "提问内容", "category": "维度英文", "categoryLabel": "维度中文"}
  ]
}`,
          },
          {
            role: "user",
            content: `课题背景：${topicContext}\n已有提问：${JSON.stringify(existingQuestions || [])}`,
          },
        ],
        max_completion_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content || "{}";
      res.json(JSON.parse(content));
    } catch (error) {
      console.error("Error generating shadow questions:", error);
      res.status(500).json({ error: "Failed to generate shadow questions" });
    }
  });

  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { topic, goldenQuestions, reflections, actionPlan } = req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `你是一位行动学习催化师AI助手。请生成一份完整的研讨总结报告。

请以Markdown格式输出，包含以下部分：
1. 研讨课题概述
2. 黄金问题回顾
3. 核心洞察
4. 行动计划摘要
5. 后续建议

语言风格：专业、简洁、有洞察力。`,
          },
          {
            role: "user",
            content: `课题：${JSON.stringify(topic)}\n黄金问题：${JSON.stringify(goldenQuestions)}\n反思记录：${JSON.stringify(reflections)}\n行动计划：${JSON.stringify(actionPlan)}`,
          },
        ],
        stream: true,
        max_completion_tokens: 8192,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Error generating summary:", error);
      if (res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ error: "Failed to generate summary" })}\n\n`,
        );
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate summary" });
      }
    }
  });

  app.post("/api/workshops", async (req, res) => {
    try {
      const {
        topicTitle,
        topicBackground,
        topicPainPoints,
        topicTriedActions,
        totalScore,
        goldenQuestions,
        participants,
        reflections,
        actionPlan,
        summaryReport,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO workshops (topic_title, topic_background, topic_pain_points, topic_tried_actions, total_score, golden_questions, participants, reflections, action_plan, summary_report)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          topicTitle || '',
          topicBackground || '',
          topicPainPoints || '',
          topicTriedActions || '',
          totalScore || 0,
          JSON.stringify(goldenQuestions || []),
          JSON.stringify(participants || []),
          reflections || '',
          JSON.stringify(actionPlan || []),
          summaryReport || '',
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error saving workshop:", error);
      res.status(500).json({ error: "Failed to save workshop" });
    }
  });

  app.get("/api/workshops", async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, topic_title, total_score, participants, summary_report, created_at, completed_at
         FROM workshops ORDER BY created_at DESC LIMIT 50`
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      res.status(500).json({ error: "Failed to fetch workshops" });
    }
  });

  app.get("/api/workshops/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `SELECT * FROM workshops WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Workshop not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching workshop:", error);
      res.status(500).json({ error: "Failed to fetch workshop" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
