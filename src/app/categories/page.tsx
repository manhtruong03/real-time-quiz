import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Brain, Code, Globe, Atom, Music, Film, BookOpen, Dumbbell } from "lucide-react"
import { AppHeader } from "@/src/components/layout/AppHeader";

const categories = [
  {
    id: "science",
    name: "Science",
    description: "Test your knowledge of scientific concepts, discoveries, and theories",
    icon: Atom,
    color: "bg-green-100 dark:bg-green-900",
    iconColor: "text-green-500",
    questionCount: 500,
  },
  {
    id: "technology",
    name: "Technology",
    description: "Challenge yourself with questions about gadgets, innovations, and tech history",
    icon: Code,
    color: "bg-purple-100 dark:bg-purple-900",
    iconColor: "text-purple-500",
    questionCount: 450,
  },
  {
    id: "history",
    name: "History",
    description: "Journey through time with questions about historical events and figures",
    icon: BookOpen,
    color: "bg-amber-100 dark:bg-amber-900",
    iconColor: "text-amber-500",
    questionCount: 600,
  },
  {
    id: "geography",
    name: "Geography",
    description: "Explore the world with questions about countries, landmarks, and natural features",
    icon: Globe,
    color: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-500",
    questionCount: 400,
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Test your knowledge of movies, TV shows, music, and pop culture",
    icon: Film,
    color: "bg-red-100 dark:bg-red-900",
    iconColor: "text-red-500",
    questionCount: 550,
  },
  {
    id: "music",
    name: "Music",
    description: "From classical to contemporary, test your musical knowledge",
    icon: Music,
    color: "bg-pink-100 dark:bg-pink-900",
    iconColor: "text-pink-500",
    questionCount: 350,
  },
  {
    id: "sports",
    name: "Sports",
    description: "Challenge yourself with questions about athletes, teams, and sporting events",
    icon: Dumbbell,
    color: "bg-orange-100 dark:bg-orange-900",
    iconColor: "text-orange-500",
    questionCount: 480,
  },
  {
    id: "general",
    name: "General Knowledge",
    description: "A mix of questions from various categories to test your overall knowledge",
    icon: Brain,
    color: "bg-teal-100 dark:bg-teal-900",
    iconColor: "text-teal-500",
    questionCount: 700,
  },
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* === Use AppHeader === */}
      <AppHeader currentPage="categories" />
      {/* ===================== */}

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Quiz Categories</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from a variety of categories to test your knowledge and challenge yourself {/* ... */}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* ... card content ... */}
                <CardHeader className={`${category.color}`}> {/* ... */} </CardHeader>
                <CardContent className="pt-6"> {/* ... */} </CardContent>
                <CardFooter>
                  <Link href={`/quiz/new?category=${category.id}`} className="w-full">
                    <Button className="w-full">Start Quiz</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t py-8">
        {/* ... rest of footer ... */}
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VUI QUIZ</span>
          </div>
          <p className="text-muted-foreground text-sm"> &copy; {new Date().getFullYear()} VUI QUIZ. All rights reserved. </p>
        </div>
      </footer>
    </div>
  );
}