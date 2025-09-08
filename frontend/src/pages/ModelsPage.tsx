import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
} from '@mui/material';
import {
  Psychology,
  PlayArrow,
  Settings,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useLLM } from '@/hooks/useLLM';
import { LLMModel } from '@/types';

const ModelCard: React.FC<{
  model: LLMModel;
  onTest: () => void;
  onConfigure: () => void;
}> = ({ model, onTest, onConfigure }) => {
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle /> : <Error />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-4px)',
          },
        }}
      >
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Psychology sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                {model.name}
              </Typography>
              <Chip
                icon={getStatusIcon(model.is_active)}
                label={model.is_active ? 'Active' : 'Inactive'}
                color={getStatusColor(model.is_active)}
                size="small"
              />
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {model.description}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Model Type: {model.model_type}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Model ID: {model.model_id}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Max Tokens: {model.max_tokens.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Temperature: {model.temperature}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayArrow />}
              onClick={onTest}
              disabled={!model.is_active}
              fullWidth
            >
              Test
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Settings />}
              onClick={onConfigure}
              fullWidth
            >
              Configure
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ModelsPage: React.FC = () => {
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [testPrompt, setTestPrompt] = useState('Hello, how are you?');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const {
    models,
    isLoadingModels,
    testModel,
    isTestingModel,
  } = useLLM();

  const handleTestModel = (model: LLMModel) => {
    setSelectedModel(model);
    setTestPrompt('Hello, how are you?');
    setTestResponse('');
    setTestError(null);
    setTestDialogOpen(true);
  };

  const handleConfigureModel = (model: LLMModel) => {
    // TODO: Implement model configuration
    console.log('Configure model:', model);
  };

  const runTest = async () => {
    if (!selectedModel) return;

    setIsTesting(true);
    setTestError(null);
    setTestResponse('');

    try {
      const result = await testModel({
        modelId: selectedModel.id,
        prompt: testPrompt,
        temperature: selectedModel.temperature,
        maxTokens: 100,
      });
      setTestResponse(result.response);
    } catch (error: any) {
      setTestError(error.message || 'Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestClose = () => {
    setTestDialogOpen(false);
    setSelectedModel(null);
    setTestResponse('');
    setTestError(null);
  };

  if (isLoadingModels) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            AI Models
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and test available AI models
          </Typography>
        </Box>
      </motion.div>

      {/* Models Grid */}
      <Grid container spacing={3}>
        {models.map((model) => (
          <Grid item xs={12} sm={6} md={4} key={model.id}>
            <ModelCard
              model={model}
              onTest={() => handleTestModel(model)}
              onConfigure={() => handleConfigureModel(model)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Test Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={handleTestClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Test Model: {selectedModel?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Test Prompt"
              multiline
              rows={3}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={runTest}
              disabled={isTesting || !testPrompt.trim()}
            >
              {isTesting ? 'Testing...' : 'Run Test'}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          {testError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {testError}
            </Alert>
          )}

          {testResponse && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Response:
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {testResponse}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTestClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
