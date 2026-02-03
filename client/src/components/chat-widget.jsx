import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send } from "lucide-react";
// Add useLocation to your wouter imports
import { useLocation } from "wouter";
export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const { user } = useAuth();
    const scrollRef = useRef(null);
    // Inside ChatWidget() function:
    const [location] = useLocation();
    useEffect(() => {
        if (location === "/dashboard/room-service") {
            setIsOpen(true);
        }
    }, [location]);
    const { data: messages = [] } = useQuery({
        queryKey: [api.chat.list.path],
        refetchInterval: 3000,
    });
    const sendMessage = useMutation({
        mutationFn: async (content) => {
            const res = await apiRequest("POST", api.chat.send.path, { content });
            return res.json();
        },
        onSuccess: () => {
            setInput("");
            queryClient.invalidateQueries({ queryKey: [api.chat.list.path] });
        },
    });
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);
    if (!user)
        return null;
    return (<div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (<Button size="lg" className="rounded-full h-14 w-14 shadow-lg" onClick={() => setIsOpen(true)}>
          <MessageSquare className="h-6 w-6"/>
        </Button>) : (<Card className="w-[calc(100vw-2rem)] sm:w-80 h-[450px] max-h-[calc(100vh-2rem)] shadow-2xl flex flex-col">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4"/> Room Service Chat
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>×</Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => (<div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? "items-end" : "items-start"}`}>
                    <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] sm:max-w-[80%] ${msg.senderId === user.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"}`}>
                      {user.role !== "guest" && msg.senderId !== user.id && (<div className="text-[10px] font-bold opacity-70 mb-1">
                          {msg.sender?.name || "Guest"}
                        </div>)}
                      {msg.content}
                    </div>
                  </div>))}
              </div>
            </ScrollArea>
            <div className="p-3 sm:p-4 border-t flex gap-2">
              <Input placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && input && sendMessage.mutate(input)} className="text-base"/>
              <Button size="icon" disabled={!input || sendMessage.isPending} onClick={() => sendMessage.mutate(input)}>
                <Send className="h-4 w-4"/>
              </Button>
            </div>
          </CardContent>
        </Card>)}
    </div>);
}
//# sourceMappingURL=chat-widget.jsx.map