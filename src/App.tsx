import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Check,
  AlertCircle,
  BookMarked,
  Lightbulb,
  AlertTriangle,
  Clipboard,
  CheckSquare,
  HelpCircle,
  Compass,
  ArrowRight,
  MessageSquare,
  Lock,
  Unlock,
  ExternalLink,
  Download
} from "lucide-react";
import { Language, ChatMessage, HsgAnalysis, HsgPreset } from "./types";
import MarkdownRenderer from "./components/MarkdownRenderer";

export default function App() {
  // Competitive Programming Learning Workspace States
  const [hsgProblemUrl, setHsgProblemUrl] = useState<string>("");
  const [hsgProblemDescription, setHsgProblemDescription] = useState<string>("");
  const [hsgAge, setHsgAge] = useState<number>(14); // default 14 years old (Lớp 9)
  const [hsgTargetLang, setHsgTargetLang] = useState<Language>("cpp");
  
  const [hsgIsAnalyzing, setHsgIsAnalyzing] = useState<boolean>(false);
  const [hsgAnalysis, setHsgAnalysis] = useState<HsgAnalysis | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  
  const [hsgCodeUnlocked, setHsgCodeUnlocked] = useState<boolean>(false);
  const [unlockedCode, setUnlockedCode] = useState<string>("");
  const [unlockedExplanation, setUnlockedExplanation] = useState<string>("");
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Socratic Step-by-Step Learning States
  const [currentSocraticStepIndex, setCurrentSocraticStepIndex] = useState<number>(0);
  const [socraticCompleted, setSocraticCompleted] = useState<boolean>(false);

  // Auto scroll to chat bottom
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  // Analyze HSG Problem & Design Algorithm (No Code)
  const handleHsgAnalyze = async () => {
    if (!hsgProblemUrl.trim() && !hsgProblemDescription.trim()) {
      alert("Vui lòng nhập link đề bài hoặc nội dung mô tả đề bài để bắt đầu học tập!");
      return;
    }
    setHsgIsAnalyzing(true);
    setHsgAnalysis(null);
    setChatMessages([]);
    setHsgCodeUnlocked(false);
    setUnlockedCode("");
    setUnlockedExplanation("");

    try {
      const response = await fetch("/api/hsg/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemUrl: hsgProblemUrl,
          problemDescription: hsgProblemDescription,
          age: hsgAge,
          targetLang: hsgTargetLang
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể kết nối đến hệ thống phân tích thuật toán.");
      }

      const data = await response.json();
      
      // Setup Socratic Steps (use returned steps, with a solid fallback if needed)
      const finalSteps = data.socraticSteps && data.socraticSteps.length >= 4 
        ? data.socraticSteps 
        : [
            {
              stepNumber: 1,
              title: "Hiểu đề bài & Giới hạn",
              question: `Với bài toán **${data.problemTitle || "này"}**, giới hạn N và thời gian chạy tối đa thường là bao nhiêu em nhỉ? Với lứa tuổi ${hsgAge} tuổi, em nghĩ độ phức tạp tối ưu nào sẽ vượt qua được toàn bộ các testcase mà không bị TLE (Time Limit Exceeded)?`,
              options: [
                "Độ phức tạp O(N^2) (Chạy khoảng 10^10 phép tính với N=10^5, chắc chắn quá thời gian)",
                "Độ phức tạp tối ưu O(N) hoặc O(N log N) (Chạy dưới 10^7 phép tính, vượt qua tất cả testcase)",
                "Em chưa biết cách ước lượng, xin Thầy trợ giúp thêm!"
              ],
              correctOptionIdx: 1,
              explanation: `Rất chính xác! Với máy tính hiện đại, khoảng 10^7 - 10^8 phép tính sẽ chạy mất 1 giây. Nếu N=10^5 mà dùng O(N^2) thì sẽ mất 10^10 phép tính (khoảng 100 giây!), chắc chắn bị TLE. Do đó dùng O(N) hoặc O(N log N) là lựa chọn tối ưu tuyệt đối!`
            },
            {
              stepNumber: 2,
              title: "Tư duy tìm giải thuật",
              question: `Dựa trên phân tích, giải thuật đề xuất cho bài này là **${data.algorithmName || "Tối ưu"}**. Em nghĩ ý tưởng cốt lõi của giải thuật này là gì?`,
              options: [
                "Giải quyết tuần tự bằng cách duyệt qua mọi khả năng (Brute force)",
                "Chia bài toán lớn thành các bài toán con gối nhau và lưu trữ kết quả để tránh tính lại (Quy hoạch động / Memoization)",
                "Lựa chọn phương án tối ưu cục bộ ngay tại mỗi bước với hy vọng đạt tối ưu toàn cục (Tham lam)"
              ],
              correctOptionIdx: 1,
              explanation: `Đúng rồi! Quy hoạch động (hoặc tối ưu hóa trạng thái) chính là việc chia nhỏ bài toán và ghi nhớ kết quả. Việc này giúp chúng ta giảm độ phức tạp từ mũ hoặc đa thức bậc cao xuống tuyến tính O(N) hoặc O(N log N) cực kỳ ngoạn mục!`
            },
            {
              stepNumber: 3,
              title: "Thiết lập cấu trúc lưu trữ",
              question: "Trong lập trình C++ cho thuật toán này, cấu trúc dữ liệu nào thường được ưu tiên sử dụng để lưu trữ động các giá trị trung gian một cách hiệu quả và tiết kiệm bộ nhớ nhất?",
              options: [
                "Mảng tĩnh có kích thước khổng lồ cố định (C-style array như int a[100000000])",
                "Cấu trúc mảng động std::vector trong thư viện STL C++ (co dãn linh hoạt, cấp phát an toàn)",
                "Sử dụng cấu trúc danh sách liên kết đơn tự cài đặt bằng con trỏ"
              ],
              correctOptionIdx: 1,
              explanation: "Hoàn hảo! `std::vector` là lựa chọn chuẩn mực nhất trong lập trình thi đấu C++. Nó vừa hỗ trợ truy cập ngẫu nhiên O(1), vừa có thể co dãn kích thước linh hoạt, tránh bị tràn bộ nhớ stack hoặc lãng phí tài nguyên hệ thống."
            },
            {
              stepNumber: 4,
              title: "Xử lý Corner Cases",
              question: "Trước khi bắt tay vào code C++, một lập trình viên HSG giỏi cần lưu ý trường hợp đặc biệt (Corner Case) nào đối với bài toán này?",
              options: [
                "Dữ liệu đầu vào cực nhỏ (N = 1 hoặc mảng rỗng) và khả năng tràn số (overflow) khi kết quả vượt quá giới hạn kiểu int 32-bit",
                "Không cần kiểm tra gì cả, các testcase luôn hoàn hảo",
                "Chỉ cần quan tâm đến trường hợp dữ liệu lớn nhất"
              ],
              correctOptionIdx: 0,
              explanation: "Tuyệt vời! Rất nhiều học sinh giỏi bị mất điểm đáng tiếc chỉ vì quên xử lý dữ liệu cực nhỏ (như N = 1) hoặc bị tràn số (với kết quả lớn hơn 2 * 10^9, phải dùng kiểu `long long` trong C++). Em đã có tư duy của một nhà vô địch rồi đó!"
            }
          ];

      const enrichedData = {
        ...data,
        socraticSteps: finalSteps
      };

      setHsgAnalysis(enrichedData);
      setCurrentSocraticStepIndex(0);
      setSocraticCompleted(false);

      // Initialize chat with a welcoming pedagogical message
      const welcomeMsg: ChatMessage = {
        sender: "ai",
        text: `Chào em! Thầy đã phân tích đề bài toán **${enrichedData.problemTitle || "bài tập này"}** rồi nhé. 🎉 

Để giải quyết tối ưu bài toán này ở lứa tuổi **${hsgAge} tuổi**, phương án hiệu quả nhất là sử dụng giải thuật **${enrichedData.algorithmName || "tối ưu"}**.

Thầy đã cập nhật chi tiết **Ý tưởng & Các bước tư duy cốt lõi** ở khung bên trái. 

Để rèn luyện tư duy tự lập chủ động đúng chuẩn Socratic, thầy trò mình sẽ trải qua **4 bước thử thách hỏi đáp gợi mở**. **Có click hiểu, trả lời đúng thì mới cung cấp tiếp**. Khi hoàn thành xuất sắc 4 bước, mã nguồn mẫu C++ tối ưu kèm bình luận giải thích chi tiết sẽ tự động mở khóa nhé! 👇`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const firstQuestionMsg: ChatMessage = {
        sender: "ai",
        text: `### 🎯 **Thử thách 1/4: ${enrichedData.socraticSteps[0].title}**\n\n${enrichedData.socraticSteps[0].question}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages([welcomeMsg, firstQuestionMsg]);
      
      // Scroll to learning board
      setTimeout(() => {
        const workspace = document.getElementById("khu-vuc-hoc-tap");
        if (workspace) {
          workspace.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    } catch (err: any) {
      alert(`Đã xảy ra lỗi khi phân tích: ${err.message}`);
    } finally {
      setHsgIsAnalyzing(false);
    }
  };

  // Chat with the HSG Tutor Coach
  const handleHsgSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading || !hsgAnalysis) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/hsg/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          problemTitle: hsgAnalysis.problemTitle,
          problemSummary: hsgAnalysis.problemSummary,
          algorithmName: hsgAnalysis.algorithmName,
          thinkingSteps: hsgAnalysis.thinkingSteps,
          age: hsgAge
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể kết nối đến Trợ giảng AI.");
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        sender: "ai",
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        sender: "ai",
        text: `Có lỗi đường truyền một chút: ${err.message}. Em gửi lại câu hỏi cho thầy nhé!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle student clicking on a Socratic option
  const handleSocraticSelectOption = async (optionIdx: number) => {
    if (!hsgAnalysis || chatLoading) return;
    const currentStep = hsgAnalysis.socraticSteps[currentSocraticStepIndex];
    if (!currentStep) return;

    // 1. Add user message
    const userMsg: ChatMessage = {
      sender: "user",
      text: `Dạ em chọn phương án: **${currentStep.options[optionIdx]}**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    // Simulate thinking duration for realistic interaction
    setTimeout(async () => {
      setChatLoading(false);
      
      const isCorrect = optionIdx === currentStep.correctOptionIdx;
      
      if (isCorrect) {
        // Success explanation from the coach
        const explanationMsg: ChatMessage = {
          sender: "ai",
          text: `🎉 **Chính xác! Thầy khen em nhé.**\n\n${currentStep.explanation}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const nextStepIndex = currentSocraticStepIndex + 1;
        
        if (nextStepIndex < hsgAnalysis.socraticSteps.length) {
          // Progress to next step
          setCurrentSocraticStepIndex(nextStepIndex);
          
          const nextStep = hsgAnalysis.socraticSteps[nextStepIndex];
          const nextQuestionMsg: ChatMessage = {
            sender: "ai",
            text: `### 🎯 **Thử thách ${nextStepIndex + 1}/4: ${nextStep.title}**\n\n${nextStep.question}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          setChatMessages(prev => [...prev, explanationMsg, nextQuestionMsg]);
        } else {
          // Socratic journey completed successfully!
          setSocraticCompleted(true);
          setCurrentSocraticStepIndex(4); // indicates all 4 completed
          
          const congratsMsg: ChatMessage = {
            sender: "ai",
            text: `🏆 **CHÚC MỪNG EM ĐÃ HOÀN THÀNH XUẤT SẮC 4 BƯỚC TƯ DUY!** 🏆\n\nEm đã hoàn toàn thấu hiểu bản chất và cấu trúc tối ưu của giải thuật **${hsgAnalysis.algorithmName}** cho bài toán này ở độ tuổi ${hsgAge} tuổi rồi! Thầy rất tự hào về tư duy nhạy bén của em.\n\nNhư đã hứa, thầy đã kích hoạt giải thuật và **TỰ ĐỘNG MỞ KHÓA** lời giải mẫu C++ tối ưu nhất kèm chú thích chi tiết cho em ở khu vực học tập bên trái rồi nhé! Hãy nghiên cứu kỹ để rèn luyện kỹ năng code nha! 🚀`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          setChatMessages(prev => [...prev, explanationMsg, congratsMsg]);
          
          // Trigger automatic code unlock
          setIsUnlocking(true);
          try {
            const response = await fetch("/api/hsg/unlock-code", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                problemTitle: hsgAnalysis.problemTitle,
                problemSummary: hsgAnalysis.problemSummary,
                algorithmName: hsgAnalysis.algorithmName,
                thinkingSteps: hsgAnalysis.thinkingSteps,
                age: hsgAge,
                targetLang: hsgTargetLang
              })
            });

            if (response.ok) {
              const data = await response.json();
              setUnlockedCode(data.code || "");
              setUnlockedExplanation(data.explanation || "");
              setHsgCodeUnlocked(true);
            }
          } catch (err) {
            console.error("Auto-unlock error:", err);
          } finally {
            setIsUnlocking(false);
          }
        }
      } else {
        // Prompt for incorrect choice
        const retryMsg: ChatMessage = {
          sender: "ai",
          text: `💡 **Gợi ý thêm cho em một chút nhé:** Phương án em chọn chưa phải là tối ưu hoặc chính xác nhất cho bài toán này ở lứa tuổi ${hsgAge} tuổi đâu nè.\n\nEm hãy đọc kỹ lại phân tích thuật toán hoặc các lựa chọn còn lại để thử lại nhé! Thầy tin em sẽ tìm ra đáp án đúng thôi! ✨`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, retryMsg]);
      }
    }, 1000);
  };

  // Unlock Code Solution
  const handleHsgUnlockCode = async () => {
    if (!hsgAnalysis) return;
    setIsUnlocking(true);

    try {
      const response = await fetch("/api/hsg/unlock-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemTitle: hsgAnalysis.problemTitle,
          problemSummary: hsgAnalysis.problemSummary,
          algorithmName: hsgAnalysis.algorithmName,
          thinkingSteps: hsgAnalysis.thinkingSteps,
          age: hsgAge,
          targetLang: hsgTargetLang
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể lấy lời giải mã nguồn.");
      }

      const data = await response.json();
      setUnlockedCode(data.code || "");
      setUnlockedExplanation(data.explanation || "");
      setHsgCodeUnlocked(true);

      const unlockNotify: ChatMessage = {
        sender: "ai",
        text: `🎉 Xuất sắc! Thầy rất tự hào vì em đã tập trung làm chủ thuật toán. 

Thầy đã chính thức mở khóa lời giải **C++** chuẩn mực, tối ưu bậc nhất kèm theo các chú thích giải thích chi tiết ở khung biên soạn bên dưới rồi nhé! 

Em hãy đọc kỹ các thư viện, cấu trúc dữ liệu và logic triển khai để học hỏi phong cách viết code chuyên nghiệp nha. Có thắc mắc gì nữa cứ hỏi thầy nhé!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, unlockNotify]);
    } catch (err: any) {
      alert(`Không thể mở khóa mã nguồn: ${err.message}`);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCopyCode = () => {
    if (!unlockedCode) return;
    navigator.clipboard.writeText(unlockedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCpp = () => {
    if (!unlockedCode) return;
    const blob = new Blob([unlockedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const titleSanitized = hsgAnalysis?.problemTitle
      ? hsgAnalysis.problemTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '_')
      : 'giai_thuat';
    link.download = `${titleSanitized}.cpp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16 antialiased">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-fpt-blue text-white rounded-xl shadow-md">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  QuanLHK - Coding Assitant Class
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 bg-fpt-orange/10 text-fpt-orange rounded-full border border-fpt-orange/20 uppercase tracking-wide">
                  Học Lập Trình Thuật Toán
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Nền tảng rèn luyện thuật toán học sinh giỏi, học thuật C++ chủ động và thấu hiểu tư duy!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-700 px-2.5 py-1">
              Designed by QuanLHK with Vibe Coding
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 mt-8">

        {/* INTRODUCTION HERO */}
        <section className="bg-radial from-fpt-blue/5 to-white border border-fpt-blue/10 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-fpt-blue/10 text-fpt-blue border border-fpt-blue/20 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-fpt-blue" />
              <span>Phương pháp sư phạm Socratic chủ động</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Lớp học Thuật toán HSG C++ Thông minh
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Chào mừng các em học sinh đến với không gian học thuật chuyên sâu. Thay vì sao chép code thụ động, hệ thống sẽ đồng hành cùng các em qua 3 bước: 
              <span className="text-fpt-blue font-bold"> 1. Phân tích bản chất thuật toán</span>, 
              <span className="text-fpt-orange font-bold"> 2. Trao đổi, hỏi đáp cùng trợ giảng AI</span> cho tới khi hiểu rõ ý tưởng, và 
              <span className="text-fpt-green font-bold"> 3. Mở khóa mã nguồn mẫu chất lượng cao</span> có đầy đủ chú thích chi tiết.
            </p>
          </div>
        </section>

        {/* INPUT AREA */}
        <section id="nhap-de-bai" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <BookMarked className="w-5 h-5 text-fpt-blue" />
            <div>
              <h3 className="font-bold text-base text-slate-900">Nạp đề bài học tập</h3>
              <p className="text-xs text-slate-500">Dán link đề từ các trang chấm tự động để hệ thống tự động tìm đề và thu thập thông tin đề bài.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Inputs */}
            <div className="lg:col-span-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Đường dẫn đề bài (Link đề từ Codeforces, VNOI, SPOJ, USACO... hệ thống sẽ tự động dùng AI để thu thập và phân tích trực tiếp!)
                </label>
                <input
                  type="text"
                  value={hsgProblemUrl}
                  onChange={(e) => setHsgProblemUrl(e.target.value)}
                  placeholder="Dán link bài tập tại đây (Ví dụ: https://oj.vnoi.info/problem/lis hoặc https://codeforces.com/problemset/problem/158/A)"
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-3 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-fpt-blue focus:bg-white focus:ring-2 focus:ring-fpt-blue/10 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Nội dung đề bài chi tiết hoặc ghi chú (Tùy chọn nếu dán link, hoặc nhập trực tiếp đề nếu không có link)
                </label>
                <textarea
                  value={hsgProblemDescription}
                  onChange={(e) => setHsgProblemDescription(e.target.value)}
                  placeholder="Dán tóm tắt yêu cầu, các giới hạn thời gian, bộ nhớ, hoặc các bộ test mẫu tại đây nếu đề không có link công khai..."
                  className="w-full h-40 bg-slate-50 border border-slate-200 text-sm p-4 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-fpt-blue focus:bg-white focus:ring-2 focus:ring-fpt-blue/10 transition-all resize-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Right Settings */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 p-5 md:p-6 rounded-2xl flex flex-col justify-between gap-6">
              
              {/* Age Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Độ tuổi của em:
                  </label>
                  <span className="text-sm font-black text-fpt-blue bg-fpt-blue/5 px-2.5 py-1 rounded-lg border border-fpt-blue/10">
                    {hsgAge} tuổi
                  </span>
                </div>
                
                <input
                  type="range"
                  min="10"
                  max="18"
                  value={hsgAge}
                  onChange={(e) => setHsgAge(Number(e.target.value))}
                  className="w-full accent-fpt-orange cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
                
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                  <div className="font-extrabold text-fpt-blue">
                    Trình độ khuyên học: {hsgAge <= 11 ? `Lớp ${hsgAge - 5} (Tiểu học)` : hsgAge <= 14 ? `Lớp ${hsgAge - 5} (Trung học cơ sở)` : `Lớp ${hsgAge - 5} (Trung học phổ thông)`}
                  </div>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    {hsgAge <= 11 && "Góc phân tích dùng sơ đồ trực quan, ví dụ cuộc sống thực tế, giải thích thuật toán bằng hình ảnh dễ hiểu."}
                    {hsgAge > 11 && hsgAge <= 14 && "Thích hợp luyện thi HSG cấp Quận/Thành phố. Phân tích logic toán học, tối ưu cấu trúc dữ liệu cơ bản."}
                    {hsgAge > 14 && "Định hướng thi HSG cấp Tỉnh/Quốc gia. Tập trung chuyên sâu các cấu trúc dữ liệu lớn, quy hoạch động nâng cao."}
                  </p>
                </div>
              </div>

              {/* Language Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Ngôn ngữ học tập mục tiêu:</label>
                <div className="p-3 bg-fpt-blue/5 rounded-xl border border-fpt-blue/10 flex items-center justify-between">
                  <span className="text-xs font-black text-fpt-blue">⚙️ C++ (Ngôn ngữ HSG chính thức)</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-fpt-green text-white rounded-full">Kích hoạt</span>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button
                type="button"
                onClick={handleHsgAnalyze}
                disabled={hsgIsAnalyzing}
                className="w-full bg-fpt-blue hover:bg-fpt-blue/90 disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {hsgIsAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Thầy trợ giảng đang nghiên cứu đề bài...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4.5 h-4.5 text-fpt-orange" />
                    <span>Phân tích & Vận hành Lớp học 🚀</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </section>

        {/* LOADING INDICATOR SCREEN */}
        {hsgIsAnalyzing && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
            <div className="w-12 h-12 border-4 border-fpt-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="font-bold text-slate-800 text-base">Thầy trợ giảng đang nghiên cứu giải pháp tối ưu...</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                AI đang thiết kế giải thuật tối ưu chuẩn C++ và biên soạn lộ trình học Socratic phù hợp với trình độ {hsgAge} tuổi của em.
              </p>
            </div>
          </div>
        )}

        {/* WORKSPACE AREA (VISIBLE ONLY AFTER ANALYSIS) */}
        {hsgAnalysis && (
          <section id="khu-vuc-hoc-tap" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Column 1: Solution Design & References (lg:col-span-4) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[800px] overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-fpt-blue" />
                  <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">💡 Thiết kế thuật toán</span>
                </div>
                <span className="text-[11px] font-bold text-fpt-blue bg-fpt-blue/5 border border-fpt-blue/10 px-3 py-1 rounded-full uppercase">
                  {hsgAnalysis.algorithmName || "Mô hình toán học"}
                </span>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 leading-relaxed text-sm">
                
                {/* Title */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bài toán hiện tại:</div>
                  <h2 className="text-xl font-black text-slate-900 border-l-4 border-fpt-blue pl-3">
                    {hsgAnalysis.problemTitle}
                  </h2>
                  <div className="text-xs font-semibold bg-slate-50 text-slate-600 p-4 rounded-xl border border-slate-200 leading-relaxed">
                    <strong className="text-slate-800 font-bold">Tóm tắt yêu cầu:</strong> {hsgAnalysis.problemSummary}
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-slate-400" /> Các bước tư duy khoa học ({hsgAge} tuổi)
                  </h4>
                  <div className="bg-fpt-blue/5 p-5 rounded-2xl border border-fpt-blue/10 leading-relaxed text-slate-700">
                    <MarkdownRenderer content={hsgAnalysis.thinkingSteps} />
                  </div>
                </div>

                {/* Big-O Complexity */}
                <div className="bg-fpt-orange/5 p-4 rounded-xl border border-fpt-orange/20 space-y-1.5">
                  <h5 className="text-[11px] font-black text-fpt-orange uppercase tracking-wide flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-fpt-orange" /> Độ phức tạp lý thuyết tối ưu:
                  </h5>
                  <p className="font-mono text-xs text-fpt-orange font-bold bg-fpt-orange/10 px-2.5 py-1 rounded-lg border border-fpt-orange/20 inline-block">
                    {hsgAnalysis.complexity}
                  </p>
                </div>

                {/* International Reliable Sources */}
                {hsgAnalysis.referenceLinks && hsgAnalysis.referenceLinks.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <BookMarked className="w-4 h-4 text-slate-400" /> Tài liệu & Giáo trình quốc tế:
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {hsgAnalysis.referenceLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group p-3.5 rounded-xl border border-slate-200 bg-white hover:border-fpt-blue hover:bg-fpt-blue/5 transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div className="space-y-0.5 pr-3">
                            <div className="font-bold text-xs text-slate-800 group-hover:text-fpt-blue transition-colors flex items-center gap-1">
                              {link.title}
                              <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                              Nguồn: <span className="font-bold text-fpt-blue">{link.source}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-fpt-blue group-hover:translate-x-0.5 transition-all shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Column 2: Q&A Chatbot (lg:col-span-4) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[800px] overflow-hidden">
              
              {/* Tutor Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-fpt-blue" />
                  <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">💬 Hỏi đáp Socratic cùng Trợ giảng AI</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Online
                </span>
              </div>

              {/* Socratic Step Tracker Indicator inside Q&A Panel */}
              {hsgAnalysis && hsgAnalysis.socraticSteps && (
                <div className="bg-fpt-blue/5 border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Compass className="w-4 h-4 text-fpt-orange animate-spin-slow" />
                    <span>Thử thách Socratic:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[10px] bg-fpt-orange/15 text-fpt-orange px-2 py-0.5 rounded-full border border-fpt-orange/10">
                      Bước {Math.min(4, currentSocraticStepIndex + 1)}/4
                    </span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((stepIdx) => (
                        <div
                          key={stepIdx}
                          className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                            stepIdx < currentSocraticStepIndex
                              ? "bg-fpt-green"
                              : stepIdx === currentSocraticStepIndex
                              ? "bg-fpt-orange animate-pulse"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat history */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-xs text-xs md:text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-fpt-blue text-white rounded-tr-none"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                    }`}>
                      <div className="font-semibold text-[10px] mb-1 opacity-75">
                        {msg.sender === "user" ? "Học sinh" : "Thầy trợ giảng"}
                      </div>
                      <div className="markdown-body">
                        <MarkdownRenderer content={msg.text} />
                      </div>
                      <span className={`block text-[9px] mt-1.5 text-right ${msg.sender === "user" ? "text-blue-100" : "text-slate-400"}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-fpt-blue rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-fpt-blue rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-fpt-blue rounded-full animate-bounce delay-200"></span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Thầy đang suy nghĩ...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Socratic Interactive Options - Pinned above the Input form */}
              {hsgAnalysis && hsgAnalysis.socraticSteps && currentSocraticStepIndex < hsgAnalysis.socraticSteps.length && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-fpt-orange tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-4 h-4 text-fpt-orange" />
                      Trả lời Thầy Trợ Giảng để học tiếp:
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold italic">Chọn để tương tác</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {hsgAnalysis.socraticSteps[currentSocraticStepIndex].options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSocraticSelectOption(oIdx)}
                        disabled={chatLoading}
                        className="w-full text-left bg-white hover:bg-fpt-orange/5 border border-slate-200 hover:border-fpt-orange rounded-xl p-3 text-xs font-semibold text-slate-700 hover:text-fpt-orange transition-all cursor-pointer shadow-2xs flex items-start gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-fpt-orange/10 group-hover:text-fpt-orange flex items-center justify-center shrink-0 font-bold text-[10px] text-slate-500 transition-colors">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input form */}
              <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                <form onSubmit={handleHsgSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Đặt câu hỏi thảo luận về thuật toán..."
                    className="flex-1 bg-slate-50 border border-slate-200 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-fpt-blue focus:bg-white focus:ring-2 focus:ring-fpt-blue/10 font-medium text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="bg-fpt-blue hover:bg-fpt-blue/90 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold px-4 py-3 rounded-xl text-xs transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    Gửi
                  </button>
                </form>
              </div>
            </div>

            {/* Column 3: C++ Code Solution Workspace (lg:col-span-4) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[800px] overflow-hidden">
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-fpt-blue" />
                  <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">⚙️ Lời giải mẫu C++</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${hsgCodeUnlocked ? "bg-fpt-green/10 text-fpt-green border border-fpt-green/20" : "bg-fpt-orange/10 text-fpt-orange border border-fpt-orange/20"}`}>
                  {hsgCodeUnlocked ? "ĐÃ MỞ KHÓA" : "ĐANG KHÓA"}
                </span>
              </div>

              {/* Workspace content */}
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/20 p-5">
                {!hsgCodeUnlocked ? (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
                    {/* Socratic Progress Bar & Threshold display */}
                    {(() => {
                      const userQuestionsCount = chatMessages.filter(msg => msg.sender === "user").length;
                      const isSocraticMet = userQuestionsCount >= 3;
                      const canUnlock = socraticCompleted || isSocraticMet;
                      return (
                        <div className="space-y-4 flex flex-col h-full justify-between">
                          <div className="bg-fpt-orange/5 border border-fpt-orange/20 rounded-2xl p-4.5 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-black uppercase text-fpt-orange tracking-wider flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-fpt-orange animate-pulse" /> CÁCH 1: THỬ THÁCH SOCRATIC TƯƠNG TÁC 🔐
                              </span>
                              <span className="text-[10px] font-black text-fpt-orange bg-white px-2 py-0.5 rounded-full border border-fpt-orange/10">
                                {currentSocraticStepIndex}/4 bước
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    currentSocraticStepIndex === 4 
                                      ? 'bg-fpt-green' 
                                      : currentSocraticStepIndex > 0 
                                        ? 'bg-fpt-orange' 
                                        : 'bg-fpt-blue'
                                  }`}
                                  style={{ width: `${(currentSocraticStepIndex / 4) * 100}%` }}
                                />
                              </div>
                              <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                                {currentSocraticStepIndex === 4 ? (
                                  <span className="text-fpt-green font-extrabold flex items-center gap-1">
                                    ✓ Em đã hoàn thành xuất sắc thử thách Socratic! Code đã tự động mở khóa.
                                  </span>
                                ) : (
                                  <span>
                                    Em đang ở <strong>bước {currentSocraticStepIndex + 1} của chuỗi 4 thử thách</strong> dẫn dắt lý thuyết. Hãy tương tác bằng cách click chọn câu trả lời ở bong bóng chatbot bên cạnh nhé!
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5 text-[8px] text-center font-extrabold pt-1">
                              {[1, 2, 3, 4].map((stepNum) => {
                                const active = currentSocraticStepIndex >= stepNum;
                                const current = currentSocraticStepIndex + 1 === stepNum;
                                return (
                                  <div
                                    key={stepNum}
                                    className={`p-1.5 rounded-lg border transition-all ${
                                      active 
                                        ? 'border-fpt-green/30 bg-fpt-green/5 text-fpt-green' 
                                        : current && currentSocraticStepIndex < 4
                                        ? 'border-fpt-orange/30 bg-fpt-orange/5 text-fpt-orange animate-pulse'
                                        : 'border-slate-200 bg-slate-50 text-slate-400'
                                    }`}
                                  >
                                    Bước {stepNum} {active ? "✓" : (current && currentSocraticStepIndex < 4) ? "●" : "○"}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Alternative Unlock Method: Standard Questions */}
                          <div className="bg-fpt-blue/5 border border-fpt-blue/25 rounded-2xl p-4.5 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-black uppercase text-fpt-blue tracking-wider flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-fpt-blue" /> CÁCH 2: TỰ SOẠN HỎI THẦY AI 💬
                              </span>
                              <span className="text-[10px] font-black text-fpt-blue bg-white px-2 py-0.5 rounded-full border border-fpt-blue/10">
                                {userQuestionsCount}/3 câu hỏi
                              </span>
                            </div>
                            
                            <div className="space-y-1.5">
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                                <div 
                                  className="h-full bg-fpt-blue transition-all duration-300"
                                  style={{ width: `${Math.min(100, (userQuestionsCount / 3) * 100)}%` }}
                                />
                              </div>
                              <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                                {isSocraticMet ? (
                                  <span className="text-fpt-green font-bold flex items-center gap-1">✓ Đã đủ 3 câu hỏi thảo luận bất kỳ! Đủ điều kiện mở khóa.</span>
                                ) : (
                                  <span>Tự soạn & gửi ít nhất <strong>{3 - userQuestionsCount} câu hỏi</strong> thảo luận với Thầy trợ giảng AI để mở khóa.</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed space-y-1">
                            <span className="font-extrabold text-slate-700 block">💡 Gợi ý câu hỏi:</span>
                            <ul className="list-disc pl-4 space-y-0.5">
                              <li>"Giải thích hoạt động của giải thuật này?"</li>
                              <li>"Cách tính độ phức tạp thời gian Big-O?"</li>
                              <li>"Những trường hợp đặc biệt cần lưu ý là gì?"</li>
                            </ul>
                          </div>

                          <button
                            type="button"
                            onClick={handleHsgUnlockCode}
                            disabled={isUnlocking || !canUnlock}
                            className={`w-full font-black py-4 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                              canUnlock 
                                ? 'bg-fpt-green hover:bg-fpt-green/90 text-white shadow-md' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            }`}
                          >
                            {isUnlocking ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Thầy đang biên soạn mã nguồn chuẩn thi đấu...</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4" />
                                <span>Em đã hiểu thuật toán ➔ Mở khóa mã nguồn mẫu C++</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                    <div className="flex justify-between items-center bg-emerald-50 px-3.5 py-3 rounded-xl border border-emerald-200 shrink-0">
                      <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" /> Thành công!
                      </span>
                      
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="text-[10px] font-extrabold text-fpt-blue hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadCpp}
                          className="text-[10px] font-extrabold text-fpt-orange hover:underline flex items-center gap-1 cursor-pointer border-l border-slate-200 pl-2.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải file .cpp</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Source Code Editor/Container */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-250 bg-slate-900 shadow-inner flex-1 min-h-[280px] flex flex-col">
                      <div className="absolute top-2.5 left-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider shrink-0">
                        C++ (Lời giải mẫu tối ưu của Thầy trợ giảng)
                      </div>
                      <div className="p-4 pt-8 overflow-y-auto flex-1 font-mono text-[11px] text-emerald-400 text-left whitespace-pre">
                        {unlockedCode}
                      </div>
                    </div>

                    {/* Code analysis summary */}
                    <div className="text-[11px] text-slate-600 bg-white border border-slate-200 p-3.5 rounded-xl overflow-y-auto max-h-[220px] leading-relaxed shrink-0">
                      <div className="font-bold text-slate-800 mb-1 flex items-center gap-1 sticky top-0 bg-white pb-1">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Phân tích kỹ thuật lập trình C++:
                      </div>
                      <MarkdownRenderer content={unlockedExplanation} />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </section>
        )}

      </main>

      <footer className="text-center text-xs text-slate-400 mt-20 max-w-7xl mx-auto border-t border-slate-200 pt-8 space-y-1">
        <p>© 2026 Designed by QuanLHK with Vibe Coding - Fschool Hậu Giang</p>
        <p className="text-fpt-orange font-semibold">Tích hợp Trợ lý Socratic bồi dưỡng tư duy lập trình chủ động</p>
      </footer>

    </div>
  );
}
