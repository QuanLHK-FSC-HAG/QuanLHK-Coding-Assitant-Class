import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to pause execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to handle generation with automatic fallback & retry under high demand
async function generateContentWithFallback(options: {
  model: string;
  contents: string;
  config?: any;
}) {
  const modelsToTry = [options.model, "gemini-3.5-flash", "gemini-3.1-flash-lite"];
  const maxRetries = 3;

  for (const model of modelsToTry) {
    if (!model) continue;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting generateContent using model: ${model}, attempt ${attempt}/${maxRetries}...`);
        return await ai.models.generateContent({
          model: model,
          contents: options.contents,
          config: options.config,
        });
      } catch (error: any) {
        const errorMsg = error.message || JSON.stringify(error);
        const is503OrRateLimit = errorMsg.includes("503") || errorMsg.includes("temporary") || errorMsg.includes("demand") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("UNAVAILABLE");
        
        console.warn(`[Attempt ${attempt} failed for model ${model}] Error: ${errorMsg}`);
        
        if (is503OrRateLimit && attempt < maxRetries) {
          const backoffTime = attempt * 1500; // 1.5s, 3.0s
          console.log(`Temporary high demand detected. Retrying in ${backoffTime}ms...`);
          await sleep(backoffTime);
        } else {
          // If we exhausted retries on this model, break the inner loop to move to next fallback model
          break;
        }
      }
    }
  }

  throw new Error("Tất cả các mô hình AI hiện đang bận hoặc quá tải do lượng yêu cầu tăng đột biến. Học sinh vui lòng nhấn nút thử lại sau vài giây!");
}

// Endpoint: Analyze HSG Problem & Design Algorithm (No Code)
app.post("/api/hsg/analyze", async (req, res) => {
  const { problemUrl, problemDescription, age, targetLang = "cpp" } = req.body;

  if (!problemUrl && !problemDescription) {
    return res.status(400).json({ error: "Vui lòng nhập link đề bài hoặc nội dung đề bài!" });
  }

  const ageNum = Number(age) || 14;
  const gradeStr = ageNum <= 10 ? "Lớp 5" : ageNum <= 11 ? "Lớp 6" : ageNum <= 12 ? "Lớp 7" : ageNum <= 13 ? "Lớp 8" : ageNum <= 14 ? "Lớp 9" : ageNum <= 15 ? "Lớp 10" : ageNum <= 16 ? "Lớp 11" : "Lớp 12";

  let fetchedDescription = problemDescription || "";

  // Step 1: Grounded Search to retrieve full details if problemUrl looks like a URL or reference
  if (problemUrl && (problemUrl.startsWith("http://") || problemUrl.startsWith("https://") || problemUrl.includes(".") || problemUrl.includes("/"))) {
    try {
      console.log(`URL detected: ${problemUrl}. Querying Google Search via Gemini to fetch full problem description...`);
      const searchPrompt = `Bạn là một trợ lý thông minh chuyên về lập trình thi đấu. Hãy tìm kiếm, thu thập và đọc toàn bộ thông tin chi tiết nhất về bài toán lập trình tại đường dẫn sau:
Đường dẫn bài toán: ${problemUrl}

Yêu cầu:
1. Tìm đề bài chính thức của bài toán này trên các trang VNOI, Codeforces, SPOJ, USACO, LQDOJ, v.v.
2. Hãy trích xuất và tóm tắt toàn bộ thông tin cực kỳ chi tiết bao gồm:
   - Tên chính xác của bài toán
   - Yêu cầu đề bài/Tóm tắt câu chuyện dẫn dắt
   - Các giới hạn (Constraints: giới hạn thời gian, bộ nhớ, kích thước đầu vào như N, Q, mảng...)
   - Định dạng Input/Output
   - Ví dụ bộ test (Sample Input / Sample Output)
3. Hãy ghi lại kết quả bằng tiếng Việt đầy đủ và chính xác nhất có thể.`;

      const searchResponse = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      const searchResultText = searchResponse.text;
      if (searchResultText) {
        fetchedDescription = `[Thông tin đề bài được hệ thống tự động tải từ link: ${problemUrl}]\n${searchResultText}\n\n[Mô tả bổ sung từ người dùng]:\n${problemDescription || "Không có"}`;
        console.log("Successfully retrieved problem details from Google Search Grounding!");
      }
    } catch (searchError) {
      console.error("Error retrieving problem details via Google Search Grounding:", searchError);
      // Fallback: search failed, we proceed with whatever was sent.
    }
  }

  const prompt = `Bạn là một huấn luyện viên đội tuyển học sinh giỏi Tin học (Competitive Programming Coach) và chuyên gia sư phạm.
Hãy phân tích bài toán/chủ đề sau đây dành cho học sinh ${ageNum} tuổi (trình độ khoảng ${gradeStr}):

Link đề bài/Tên bài toán: ${problemUrl || "Không có link, xem mô tả"}
Nội dung chi tiết/Mô tả đề bài: 
"""
${fetchedDescription || "Không có mô tả chi tiết, hãy suy luận dựa trên thông tin bài toán đã có"}
"""

Nhiệm vụ của bạn:
1. Tóm tắt đề bài một cách dễ hiểu, loại bỏ các chi tiết cốt truyện rườm rà.
2. Xác định thuật toán/cấu trúc dữ liệu chính tối ưu để giải bài toán này (ví dụ: Quy hoạch động, Cây phân đoạn - Segment Tree, Tìm kiếm nhị phân, Tham lam, Dijkstra, v.v.).
3. Giải thích từng bước tư duy logic (Thinking Steps) để từ đề bài dẫn dắt ra thuật toán đó. Điều chỉnh cách giải thích để phù hợp với nhận thức của học sinh ${ageNum} tuổi. Giải thích trực quan, sinh động.
4. Phân tích độ phức tạp thời gian và không gian (Complexity) bằng Big-O một cách dễ hiểu và lý giải tại sao nó chạy kịp thời gian giới hạn (thường là 1s hoặc 2s).
5. Liệt kê các link tài nguyên học thuật quốc tế UY TÍN liên quan đến thuật toán này (như usaco.guide, cp-algorithms.com, codeforces.com, cppreference.com). Cung cấp URL chính xác và tiêu đề rõ ràng để học sinh đọc thêm.

YÊU CẦU CỰC KỲ QUAN TRỌNG: 
- TUYỆT ĐỐI KHÔNG cung cấp bất kỳ mã nguồn (source code) C++ hoặc Python hoàn chỉnh nào trong bước phân tích này! Chỉ giải thích thuật toán, ý tưởng, công thức toán học hoặc mã giả (pseudocode) ngắn gọn nếu thực sự cần thiết.
- Kết quả trả về phải là một đối tượng JSON đúng định dạng như Schema quy định bên dưới.

Hãy phản hồi theo cấu trúc JSON sau:`;

  try {
    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problemTitle: {
              type: Type.STRING,
              description: "Tên chính thức của bài toán."
            },
            problemSummary: {
              type: Type.STRING,
              description: "Tóm tắt đề bài ngắn gọn, tập trung vào yêu cầu cốt lõi bằng tiếng Việt."
            },
            algorithmName: {
              type: Type.STRING,
              description: "Tên thuật toán/cấu trúc dữ liệu sử dụng (ví dụ: Quy hoạch động, BFS, Segment Tree)."
            },
            thinkingSteps: {
              type: Type.STRING,
              description: "Phân tích tư duy từng bước chi tiết dưới dạng Markdown tiếng Việt."
            },
            complexity: {
              type: Type.STRING,
              description: "Mô tả độ phức tạp thời gian và không gian (ví dụ: O(N log N) thời gian, O(N) bộ nhớ)."
            },
            referenceLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Tiêu đề của trang tài liệu tham khảo (ví dụ: Segment Tree - CP-Algorithms)" },
                  url: { type: Type.STRING, description: "Đường link URL chính xác dẫn đến tài liệu." },
                  source: { type: Type.STRING, description: "Tên nguồn uy tín: USACO Guide, CP-Algorithms, Codeforces, cppreference, VNOI, v.v." }
                },
                required: ["title", "url", "source"]
              }
            }
          },
          required: ["problemTitle", "problemSummary", "algorithmName", "thinkingSteps", "complexity", "referenceLinks"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("HSG analyze error:", error);
    res.status(500).json({ error: "Lỗi phân tích bài toán: " + error.message });
  }
});

// Endpoint: Chat with the HSG Tutor Coach
app.post("/api/hsg/chat", async (req, res) => {
  const { messages, problemTitle, problemSummary, algorithmName, thinkingSteps, age } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Thiếu lịch sử trò chuyện!" });
  }

  const ageNum = Number(age) || 14;
  const gradeStr = ageNum <= 10 ? "Lớp 5" : ageNum <= 11 ? "Lớp 6" : ageNum <= 12 ? "Lớp 7" : ageNum <= 13 ? "Lớp 8" : ageNum <= 14 ? "Lớp 9" : ageNum <= 15 ? "Lớp 10" : ageNum <= 16 ? "Lớp 11" : ageNum <= 12 ? "Lớp 12" : "Đại học";

  const chatHistoryText = messages
    .map((m: any) => `${m.sender === "user" ? "Học sinh" : "Thầy trợ giảng"}: ${m.text}`)
    .join("\n");

  const prompt = `Bạn là Thầy giáo trợ giảng chuyên bồi dưỡng Học sinh giỏi Tin học. 
Bạn đang hướng dẫn một học sinh ${ageNum} tuổi (học trình độ ${gradeStr}) cách giải quyết bài toán sau:

Tên bài toán: ${problemTitle}
Tóm tắt yêu cầu: ${problemSummary}
Thuật toán chính: ${algorithmName}
Ý tưởng chi tiết: ${thinkingSteps}

Hãy đóng vai Thầy giáo ôn tập cực kỳ thân thiện, nhiệt tình, kiên nhẫn và sâu sắc. Trò chuyện bằng tiếng Việt tự nhiên. Xưng hô là "Thầy" và gọi học sinh là "em".

Lịch sử cuộc đối thoại giữa Thầy và Học sinh:
${chatHistoryText}

Yêu cầu đối với phản hồi của Thầy giáo:
1. Giải đáp thắc mắc của học sinh về thuật toán, độ phức tạp, các trường hợp đặc biệt (corner cases), hoặc cách tổ chức cấu trúc dữ liệu.
2. TUYỆT ĐỐI KHÔNG cung cấp code C++ hoàn chỉnh! Nếu học sinh hỏi xin code, hãy trì hoãn một cách khéo léo và giải thích: "Thầy rất vui vì em muốn bắt tay vào code! Nhưng để rèn luyện tư duy HSG tốt nhất, em hãy thử tự trả lời xem đã hiểu rõ ý tưởng chưa nhé. Khi nào em thực sự hiểu rõ thuật toán, hãy nhấn nút 'Xác nhận Đã hiểu' dưới khung chat hoặc bảo thầy 'Em đã hiểu rõ' để thầy mở khóa toàn bộ mã nguồn C++ có comment giải thích chi tiết nhất cho em nha!"
3. Đưa ra các gợi ý nhỏ, các câu hỏi gợi mở để kích thích tư duy của học sinh.
4. Trình bày phản hồi ngắn gọn, dễ hiểu, sử dụng định dạng Markdown sạch đẹp.`;

  try {
    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("HSG chat error:", error);
    res.status(500).json({ error: "Lỗi trò chuyện với AI Coach: " + error.message });
  }
});

// Endpoint: Unlock Code with Detailed Explanations
app.post("/api/hsg/unlock-code", async (req, res) => {
  const { problemTitle, problemSummary, algorithmName, thinkingSteps, age } = req.body;

  const ageNum = Number(age) || 14;
  const gradeStr = ageNum <= 10 ? "Lớp 5" : ageNum <= 11 ? "Lớp 6" : ageNum <= 12 ? "Lớp 7" : ageNum <= 13 ? "Lớp 8" : ageNum <= 14 ? "Lớp 9" : ageNum <= 15 ? "Lớp 10" : ageNum <= 16 ? "Lớp 11" : ageNum <= 12 ? "Lớp 12" : "Đại học";

  const prompt = `Bạn là một lập trình viên thi đấu hàng đầu (Competitive Programmer) và Huấn luyện viên HSG xuất sắc.
Hãy viết một lời giải mã nguồn mẫu tối ưu nhất bằng ngôn ngữ C++ cho bài toán sau:

Tên bài toán: ${problemTitle}
Tóm tắt yêu cầu: ${problemSummary}
Thuật toán: ${algorithmName}
Trình độ học sinh: ${ageNum} tuổi (học sinh ${gradeStr}).

Yêu cầu cho mã nguồn của bạn:
1. Đạt hiệu năng tối ưu nhất về thời gian chạy và bộ nhớ (đáp ứng tiêu chuẩn chấm tự động trên Codeforces/USACO/VNOI).
2. Sử dụng thư viện chuẩn tốt, thiết lập fast I/O (\`std::ios_base::sync_with_stdio(false); std::cin.tie(NULL);\`), viết cấu trúc code sạch đẹp, chuẩn mực của lập trình thi đấu C++.
3. Thêm các chú thích (comments) bằng tiếng Việt cực kỳ chi tiết, dễ hiểu ở từng dòng hoặc khối lệnh quan trọng, lý giải mục đích lập trình của dòng đó phù hợp cho học sinh ${ageNum} tuổi.
4. Sử dụng tên biến có nghĩa rõ ràng, dễ theo dõi.

Yêu cầu phần giải thích đính kèm:
- Phân tích chi tiết các điểm kỹ thuật quan trọng trong code (như cách dùng STL vector/queue, tối ưu hóa bộ nhớ, xử lý số lớn long long, tránh tràn số, v.v.).

Hãy phản hồi theo định dạng JSON có cấu trúc sau:`;

  try {
    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: {
              type: Type.STRING,
              description: "Mã nguồn C++ hoàn chỉnh, tối ưu và có nhiều chú thích tiếng Việt."
            },
            explanation: {
              type: Type.STRING,
              description: "Phân tích, giải thích mã nguồn chi tiết, hướng dẫn học sinh đọc hiểu các thư viện và cấu trúc dữ liệu đã dùng bằng Markdown tiếng Việt."
            }
          },
          required: ["code", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("HSG unlock code error:", error);
    res.status(500).json({ error: "Lỗi tạo mã nguồn tối ưu: " + error.message });
  }
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
