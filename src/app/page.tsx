// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Brain, Zap, Trophy, BarChart3 } from "lucide-react";
import { AppHeader } from "@/src/components/layout/AppHeader"; // Import the new header

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* === Use AppHeader === */}
      <AppHeader currentPage="home" />
      {/* ===================== */}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* ... rest of hero section ... */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 -z-10" />
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            {/* ... content ... */}
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Nắm vững Lập trình với Quiz được hỗ trợ bởi <span className="text-primary">AI</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                VUI QUIZ tạo ra những câu hỏi mới mẻ, đầy thử thách trên nhiều ngôn ngữ lập trình khác nhau, thích ứng với
                trình độ kỹ năng của bạn để mang lại trải nghiệm học tập cá nhân hóa.
              </p>
              <div className="flex gap-4 pt-4">
                <Link href="/quiz/new" passHref>
                  <Button size="lg" className="gap-2"> <Zap className="h-5 w-5" /> Bắt đầu Quiz Lập trình </Button>
                </Link>
                <Link href="/categories">
                  <Button size="lg" variant="outline"> Khám phá Ngôn ngữ </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              {/* ... decorative elements ... */}
              <div className="relative w-full h-[400px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl overflow-hidden">
                <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-lg shadow-lg p-4 rotate-6 animate-float"> {/* ... */} </div>
                <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-lg shadow-lg p-4 -rotate-3 animate-bounce-slow"> {/* ... */} </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <Brain className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Các tính năng mạnh mẽ</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                VUI QUIZ mang đến những công cụ cần thiết để bạn tạo ra, tổ chức và trải nghiệm các bài quiz lập trình một cách hiệu quả.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature cards */}
              <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow quiz-card">
                <Brain className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Câu hỏi AI thông minh</h3>
                <p className="text-muted-foreground">Tạo ra các câu hỏi lập trình độc đáo và phù hợp với nhiều chủ đề và mức độ khó.</p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow quiz-card">
                <Trophy className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Học tập cá nhân hóa</h3>
                <p className="text-muted-foreground">Hệ thống sẽ điều chỉnh độ khó của câu hỏi dựa trên hiệu suất của bạn.</p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow quiz-card">
                <BarChart3 className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bảng xếp hạng</h3>
                <p className="text-muted-foreground">Theo dõi tiến độ của bạn và so sánh với những người chơi khác trên bảng xếp hạng.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sẵn sàng nâng cao kỹ năng lập trình của bạn?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Bắt đầu hành trình học tập tương tác của bạn ngay hôm nay. VUI QUIZ sẽ giúp bạn thành thạo lập trình một cách vui vẻ và hiệu quả.
            </p>
            <Link href="/quiz/new">
              <Button size="lg" variant="secondary" className="gap-2"> <Zap className="h-5 w-5" /> Bắt đầu Quiz Lập trình ngay </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* ... footer content ... */}
          </div>
          <div className="mt-8 text-center text-muted-foreground text-sm"> &copy; {new Date().getFullYear()} VUI QUIZ. Bảo lưu mọi quyền. </div>
        </div>
      </footer>
    </div>
  );
}