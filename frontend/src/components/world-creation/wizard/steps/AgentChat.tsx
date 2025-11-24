import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, List, ListItem, CircularProgress, Chip, Paper, Alert } from "@mui/material";
import { BASE_URL } from "../../../../const";
import type { AgentAnalysis, WorldData } from "../../../../types/world-creation";

interface Props {
  sessionId: string;
  initialInput: string;
  onComplete: (worldData: WorldData) => void;
  onError?: (error: string) => void;
}

interface Message {
  role: "user" | "agent";
  text: string;
}

export const AgentChat: React.FC<Props> = ({ sessionId, initialInput, onComplete, onError }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "user", text: initialInput }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AgentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (userInput: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/world-creation/agent/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userInput }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to analyze input");
      }
      
      const data: AgentAnalysis = await res.json();
      setAnalysis(data);
      
      if (data.next_question) {
        setMessages(prev => [...prev, { role: "agent", text: data.next_question.text }]);
      } else if (data.is_ready) {
        setMessages(prev => [...prev, { role: "agent", text: "I have enough information. Generating your world now..." }]);
        generate();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to analyze input";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/world-creation/agent/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to generate world");
      }
      
      const data: WorldData = await res.json();
      onComplete(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate world";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Initial analysis on mount
  useEffect(() => {
    analyze(initialInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "user", text: input }]);
    analyze(input);
    setInput("");
  };

  return (
    <Box sx={{ display: "flex", gap: 4, height: "100%" }}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">Conversation</Typography>
        
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", borderRadius: 1, p: 2, minHeight: 400, maxHeight: 600 }}>
          <List>
            {messages.map((msg, idx) => (
              <ListItem key={idx} alignItems="flex-start" sx={{ flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <Paper sx={{ p: 2, bgcolor: msg.role === "user" ? "primary.light" : "grey.100", maxWidth: "80%" }}>
                  <Typography variant="body1">{msg.text}</Typography>
                </Paper>
              </ListItem>
            ))}
            {loading && <CircularProgress size={20} sx={{ m: 2 }} />}
          </List>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField 
            fullWidth 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Type your answer..." 
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <Button variant="contained" onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </Button>
        </Box>
      </Box>

      <Box sx={{ width: 300, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">Knowledge Base</Typography>
        <Typography variant="subtitle2">Known Facts:</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {analysis?.known_info.map((info, idx) => (
            <Chip key={idx} label={info.length > 30 ? info.substring(0, 30) + "..." : info} title={info} size="small" />
          ))}
        </Box>
        
        <Typography variant="subtitle2" sx={{ mt: 2 }}>Missing Info:</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {analysis?.missing_info.map((info, idx) => (
            <Chip key={idx} label={info} color="warning" size="small" variant="outlined" />
          ))}
        </Box>
        
        {analysis?.is_ready && (
           <Button variant="contained" color="success" onClick={generate} disabled={loading}>
             Generate Now
           </Button>
        )}
      </Box>
    </Box>
  );
};
