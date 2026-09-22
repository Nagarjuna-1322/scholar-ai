"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { daysUntil } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Send } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

export function ChatAssistant() {
  const { profile } = useProfile();
  const { scholarships, stats } = useScholarships();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hi! How can I help? Try asking 'which scholarships am I eligible for?' or 'what are the new scholarships?'" }
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const recommendations = useMemo(() => {
    return scholarships.filter(s => s.eligible_courses.includes(profile.course) && profile.income <= s.income_limit);
  }, [profile, scholarships]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  function chatbotReply(input: string): string {
    const i = input.toLowerCase();
    if (i.includes("new") || i.includes("latest") || i.includes("update") || i.includes("recent") || i.includes("publish")) {
      const newItems = scholarships.filter(s => s.isNew);
      if (newItems.length > 0) {
        return `We have ${newItems.length} freshly published 2026-27 scholarships: ${newItems.map(s => `${s.title} (${s.amount})`).join("; ")}. Expired programs have been retired.`;
      }
      return `All active scholarships are up to date! We currently have ${scholarships.length} active opportunities.`;
    }
    if (i.includes("eligible") || i.includes("fit me") || i.includes("recommend")) {
      return `Based on your profile (Course: ${profile.course}, Income: ₹${profile.income.toLocaleString()}), I found ${recommendations.length} scholarships you might be eligible for. Check the 'Top Recommendations' panel for the best matches!`;
    }
    if (i.includes("deadline")) {
      const soon = scholarships
        .map((s) => ({ ...s, days: daysUntil(s.deadline) }))
        .filter((s) => s.days > 0)
        .sort((a, b) => a.days - b.days)
        .slice(0, 3);
      if (soon.length === 0) {
        return "No upcoming deadlines found in the near future.";
      }
      return `The soonest deadlines are: ${soon.map((s) => `${s.title} (${s.days} days)`).join(", ")}.`;
    }
    return "I can answer questions about eligibility, upcoming deadlines, and newly published scholarships. Try asking: 'What are the new scholarships?'";
  }

  const handleSend = () => {
    if (text.trim()) {
      const userMessage: Message = { sender: 'user', text: text.trim() };
      const botResponse: Message = { sender: 'bot', text: chatbotReply(text.trim()) };
      setMessages(prev => [...prev, userMessage, botResponse]);
      setText("");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Bot className="text-accent"/>
          <span>Quick Chat Assistant</span>
        </CardTitle>
        <CardDescription>Ask about eligibility and deadlines.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[300px]">
        <ScrollArea className="flex-grow mb-4 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'bot' && <Bot className="w-6 h-6 shrink-0 text-primary" />}
                        <div className={`rounded-lg px-3 py-2 max-w-[80%] break-words ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
          />
          <Button onClick={handleSend} disabled={!text.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
