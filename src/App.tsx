import { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Paper } from '@mui/material';
import { handleTranslate as _handleTranslate } from './function';

const App = () => {
    const [apiKey, setApiKey] = useState('');
    const [text, setText] = useState('');
    const [promptText, setPromptText] = useState('このゲーム実況の字幕を英語に翻訳してください');
    const [translatedText, setTranslatedText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTranslate = () => {
      setTranslatedText('')
      _handleTranslate({
        apiKey,
        promptText,
        text,
        onLoading: setLoading,
        onFinish: setTranslatedText
      })
    }

    return (
        <Container maxWidth='sm' >
            <Box mt={5}>
                <Typography variant="h4" gutterBottom>
                    AI Srt Translation
                </Typography>
                <Paper elevation={3} style={{ padding: '20px' }}>
                    <Box mb={3}>
                        <TextField
                            label="API Key"
                            variant="outlined"
                            fullWidth
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                    </Box>
                    <Box mb={3}>
                        <TextField
                            label="prompt"
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={4}
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                        />
                    </Box>
                    <Box mb={3}>
                        <TextField
                            label="Text to Translate"
                            variant="outlined"
                            fullWidth
                            multiline
                            maxRows={20}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleTranslate}
                        disabled={loading}
                    >
                        {loading ? 'Translating...' : 'Translate'}
                    </Button>
                    {translatedText && (
                        <Box mt={3}>
                            <Typography variant="h6">Translated Text:</Typography>
                            <Paper elevation={2} style={{ padding: '10px', backgroundColor: '#f4f4f4' }}>
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{translatedText}</Typography>
                            </Paper>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default App;