import React from "react";
import { Box, TextField, Typography, Button } from "@mui/material";

interface Props {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
}

export const WorldInput: React.FC<Props> = ({ value, onChange, onNext }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h4">Describe Your World</Typography>
      <Typography variant="body1">
        Tell us about the world you want to create. Mention factions, locations, the tone, or specific characters. 
        The more details you provide, the better. You can also say "Surprise me" to let the AI decide.
      </Typography>
      <TextField
        multiline
        rows={10}
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A world of floating islands where sky pirates battle dragon riders..."
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={onNext} disabled={!value.trim()}>
          Analyze & Continue
        </Button>
      </Box>
    </Box>
  );
};
