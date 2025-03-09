
import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import { cn } from '@/lib/utils';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/50">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          
          
          <div className="flex items-center">
            <nav className="hidden sm:flex items-center gap-6">
              <a href="#" className="text-sm hover:text-primary transition-colors">首页</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex flex-col flex-grow">
          {/* Hero section */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-block mb-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                恒盛和芯烨桌面打印机技术支持
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Danny数字分身
            </h2>
            <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground">
              为您提供恒盛和芯烨桌面条码打印机的故障排查、问题解答和产品推荐。
            </p>
          </div>
          
          {/* Chat interface */}
          <div className="flex-grow flex justify-center">
            <div className="w-full max-w-4xl animate-slide-in">
              <ChatInterface />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t bg-background/80 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Danny数字分身. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                隐私政策
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
