import React, { useState } from "react";
import { Box, Typography, Tabs, Tab, TextField, Button, Accordion, AccordionSummary, AccordionDetails, Alert } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { BASE_URL } from "../../../../const";
import type { WorldData } from "../../../../types/world-creation";

interface Props {
  data: WorldData;
  sessionId: string;
  onSave: () => void;
  onError?: (error: string) => void;
}

export const WorldReview: React.FC<Props> = ({ data, sessionId, onSave, onError }) => {
  const [tab, setTab] = useState(0);
  const [world, setWorld] = useState<WorldData>(data);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/world-creation/agent/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, worldData: world }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to save world");
      }
      
      onSave();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save world";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!world) return <Typography>No data generated.</Typography>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h4">Review Your World</Typography>
      
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Overview" />
        <Tab label="Factions" />
        <Tab label="Locations" />
        <Tab label="Races" />
        <Tab label="History" />
        <Tab label="Magic" />
      </Tabs>

      <Box sx={{ minHeight: 400 }}>
        {tab === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Name" value={world.name} fullWidth onChange={(e) => setWorld({...world, name: e.target.value})} />
            <TextField label="Genre" value={world.genre} fullWidth onChange={(e) => setWorld({...world, genre: e.target.value})} />
            <TextField label="Tone" value={world.tone} fullWidth onChange={(e) => setWorld({...world, tone: e.target.value})} />
            <TextField label="Primer" value={world.world_primer} multiline rows={6} fullWidth onChange={(e) => setWorld({...world, world_primer: e.target.value})} />
          </Box>
        )}
        {tab === 1 && (
          <Box>
            {world.factions?.map((faction, idx) => (
              <Accordion key={idx} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{faction.name}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField 
                    label="Name" 
                    value={faction.name} 
                    fullWidth 
                    onChange={(e) => {
                      const updated = [...(world.factions || [])];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setWorld({ ...world, factions: updated });
                    }}
                  />
                  <TextField 
                    label="Type" 
                    value={faction.type} 
                    fullWidth 
                    onChange={(e) => {
                      const updated = [...(world.factions || [])];
                      updated[idx] = { ...updated[idx], type: e.target.value };
                      setWorld({ ...world, factions: updated });
                    }}
                  />
                  <TextField 
                    label="Ideology & Goals" 
                    value={faction.ideology_and_goals} 
                    fullWidth 
                    multiline 
                    rows={3}
                    onChange={(e) => {
                      const updated = [...(world.factions || [])];
                      updated[idx] = { ...updated[idx], ideology_and_goals: e.target.value };
                      setWorld({ ...world, factions: updated });
                    }}
                  />
                  <TextField 
                    label="Structure" 
                    value={faction.structure} 
                    fullWidth 
                    multiline
                    onChange={(e) => {
                      const updated = [...(world.factions || [])];
                      updated[idx] = { ...updated[idx], structure: e.target.value };
                      setWorld({ ...world, factions: updated });
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        {tab === 2 && (
          <Box>
            {world.locations?.map((location, idx) => (
              <Accordion key={idx}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{location.name}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField 
                    label="Name" 
                    value={location.name} 
                    fullWidth 
                    onChange={(e) => {
                      const updated = [...(world.locations || [])];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setWorld({ ...world, locations: updated });
                    }}
                  />
                  <TextField 
                    label="Type" 
                    value={location.type} 
                    fullWidth 
                    onChange={(e) => {
                      const updated = [...(world.locations || [])];
                      updated[idx] = { ...updated[idx], type: e.target.value };
                      setWorld({ ...world, locations: updated });
                    }}
                  />
                  <TextField 
                    label="Appearance" 
                    value={location.appearance} 
                    fullWidth 
                    multiline 
                    rows={3}
                    onChange={(e) => {
                      const updated = [...(world.locations || [])];
                      updated[idx] = { ...updated[idx], appearance: e.target.value };
                      setWorld({ ...world, locations: updated });
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        {tab === 3 && (
          <Box>
            {world.races?.map((race, idx) => (
              <Accordion key={idx}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{race.name}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField 
                    label="Name" 
                    value={race.name} 
                    fullWidth 
                    onChange={(e) => {
                      const updated = [...(world.races || [])];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setWorld({ ...world, races: updated });
                    }}
                  />
                  <TextField 
                    label="Description" 
                    value={race.description} 
                    fullWidth 
                    multiline 
                    rows={3}
                    onChange={(e) => {
                      const updated = [...(world.races || [])];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setWorld({ ...world, races: updated });
                    }}
                  />
                  <TextField 
                    label="Special Abilities" 
                    value={race.special_abilities} 
                    fullWidth 
                    multiline
                    onChange={(e) => {
                      const updated = [...(world.races || [])];
                      updated[idx] = { ...updated[idx], special_abilities: e.target.value };
                      setWorld({ ...world, races: updated });
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        {tab === 4 && (
          <Box>
            {world.history?.map((event, idx) => (
              <Accordion key={idx}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{event.name}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField 
                    label="Event Name" 
                    value={event.name} 
                    fullWidth 
                    onChange={(e) => {
                      const updated = [...(world.history || [])];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setWorld({ ...world, history: updated });
                    }}
                  />
                  <TextField 
                    label="Timeframe" 
                    value={event.timeframe} 
                    fullWidth 
                    onChange={(e) => {
                      const updated = [...(world.history || [])];
                      updated[idx] = { ...updated[idx], timeframe: e.target.value };
                      setWorld({ ...world, history: updated });
                    }}
                  />
                  <TextField 
                    label="Description" 
                    value={event.description} 
                    fullWidth 
                    multiline 
                    rows={3}
                    onChange={(e) => {
                      const updated = [...(world.history || [])];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setWorld({ ...world, history: updated });
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        {tab === 5 && world.magic && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField 
              label="Magic Fundamentals" 
              value={world.magic.magic_fundamentals} 
              fullWidth 
              multiline 
              rows={4}
              onChange={(e) => setWorld({ ...world, magic: { ...world.magic!, magic_fundamentals: e.target.value } })}
            />
            <TextField 
              label="Power Sources" 
              value={world.magic.power_sources} 
              fullWidth 
              multiline 
              rows={3}
              onChange={(e) => setWorld({ ...world, magic: { ...world.magic!, power_sources: e.target.value } })}
            />
            <TextField 
              label="Limitations & Costs" 
              value={world.magic.limitations_and_costs} 
              fullWidth 
              multiline 
              rows={3}
              onChange={(e) => setWorld({ ...world, magic: { ...world.magic!, limitations_and_costs: e.target.value } })}
            />
            <TextField 
              label="Societal Attitude" 
              value={world.magic.societal_attitude} 
              fullWidth 
              multiline 
              rows={2}
              onChange={(e) => setWorld({ ...world, magic: { ...world.magic!, societal_attitude: e.target.value } })}
            />
            <Typography variant="h6" sx={{ mt: 2 }}>Magic Schools</Typography>
            {world.magic.magic_schools.map((school, idx) => (
              <Box key={idx} sx={{ pl: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                <TextField 
                  label="School Name" 
                  value={school.name} 
                  fullWidth 
                  size="small"
                  onChange={(e) => {
                    const updated = [...world.magic!.magic_schools];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setWorld({ ...world, magic: { ...world.magic!, magic_schools: updated } });
                  }}
                />
                <TextField 
                  label="Description" 
                  value={school.description} 
                  fullWidth 
                  multiline 
                  size="small"
                  onChange={(e) => {
                    const updated = [...world.magic!.magic_schools];
                    updated[idx] = { ...updated[idx], description: e.target.value };
                    setWorld({ ...world, magic: { ...world.magic!, magic_schools: updated } });
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save World"}
        </Button>
      </Box>
    </Box>
  );
};
