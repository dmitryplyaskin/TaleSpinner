import React, { useState } from "react";
import { Box, Stepper, Step, StepLabel, Paper, Alert } from "@mui/material";
import { SettingSelection } from "./steps/SettingSelection";
import { WorldInput } from "./steps/WorldInput";
import { QuestionForm } from "./steps/QuestionForm";
import { WorldReview } from "./steps/WorldReview";
import { BASE_URL } from "../../../const";
import type { WorldData } from "../../../types/world-creation";

const steps = ["Select Setting", "Describe World", "Refine Details", "Review & Save"];

export const Wizard = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [setting, setSetting] = useState<string>("fantasy");
  const [userInput, setUserInput] = useState("");
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleStartSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/world-creation/agent/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setting }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to start session");
      }
      
      const data = await res.json();
      setSessionId(data.sessionId);
      handleNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mt: 4, p: 4, minHeight: "60vh" }}>
        {activeStep === 0 && (
          <SettingSelection 
            selected={setting} 
            onSelect={setSetting} 
            onNext={handleStartSession}
            loading={loading}
          /> 
        )}
        {activeStep === 1 && (
          <WorldInput 
            value={userInput} 
            onChange={setUserInput} 
            onNext={handleNext}
          />
        )}
        {activeStep === 2 && sessionId && (
          <QuestionForm 
            sessionId={sessionId} 
            initialInput={userInput}
            onComplete={(data) => {
              setWorldData(data);
              handleNext();
            }} 
            onError={setError}
          />
        )}
        {activeStep === 3 && worldData && sessionId && (
          <WorldReview 
            data={worldData} 
            sessionId={sessionId}
            onSave={() => {
              alert("World Saved!");
            }}
            onError={setError}
          />
        )}
      </Paper>
    </Box>
  );
};
