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
                Master Programming with <span className="text-primary">AI-Powered</span> Quizzes
              </h1>
              <p className="text-lg text-muted-foreground">
                VUI QUIZ generates fresh, challenging questions across various programming languages, adapting to your
                skill level for a personalized learning experience.
              </p>
              <div className="flex gap-4 pt-4">
                <Link href="/quiz/new" passHref>
                  <Button size="lg" className="gap-2"> <Zap className="h-5 w-5" /> Start Coding Quiz </Button>
                </Link>
                <Link href="/categories">
                  <Button size="lg" variant="outline"> Explore Languages </Button>
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
          {/* ... rest of features section ... */}
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto"> {/* ... */} </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature cards */}
              <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow quiz-card"> {/* ... AI Questions ... */}</div>
              <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow quiz-card"> {/* ... Personalized Learning ... */}</div>
              <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow quiz-card"> {/* ... Leaderboards ... */}</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          {/* ... rest of CTA section ... */}
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Level Up Your Coding Skills?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90"> {/* ... */} </p>
            <Link href="/quiz/new">
              <Button size="lg" variant="secondary" className="gap-2"> <Zap className="h-5 w-5" /> Start Coding Quiz Now </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t py-12">
        {/* ... rest of footer ... */}
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* ... footer content ... */}
          </div>
          <div className="mt-8 text-center text-muted-foreground text-sm"> &copy; {new Date().getFullYear()} VUI QUIZ. All rights reserved. </div>
        </div>
      </footer>
    </div>
  );
}