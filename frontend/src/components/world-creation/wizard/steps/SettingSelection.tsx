import React from 'react';
import { Box, Button, Card, CardContent, Typography, CardActionArea } from '@mui/material';

interface Props {
	selected: string;
	onSelect: (val: string) => void;
	onNext: () => void;
	loading?: boolean;
}

export const SettingSelection: React.FC<Props> = ({ selected, onSelect, onNext, loading = false }) => {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
			<Typography variant="h4">Choose Your Setting</Typography>
			<Box sx={{ display: 'flex', gap: 2 }}>
				<Card
					sx={{
						width: 300,
						border: selected === 'fantasy' ? '2px solid primary.main' : 'none',
						bgcolor: selected === 'fantasy' ? 'action.selected' : 'background.paper',
					}}
				>
					<CardActionArea onClick={() => onSelect('fantasy')} disabled={loading}>
						<CardContent>
							<Typography variant="h5" component="div">
								Fantasy
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Dragons, magic, and medieval adventure.
							</Typography>
						</CardContent>
					</CardActionArea>
				</Card>
				{/* Add more settings later */}
			</Box>
			<Button variant="contained" onClick={onNext} size="large" disabled={loading}>
				{loading ? "Starting..." : "Next"}
			</Button>
		</Box>
	);
};
