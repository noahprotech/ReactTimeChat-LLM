import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Send,
  Person,
  Psychology,
  Settings,
  ExpandMore,
  Clear,
  Save,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useLLM, useConversation } from '@/hooks/useLLM';
import { Message, ChatRequest } from '@/types';
import { format } from 'date-fns';

const MessageBubble: React.FC<{
  message: Message;
  isUser: boolean;
}> = ({ message, isUser }) => {
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ListItem
        sx={{
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          mb: 2,
        }}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              bgcolor: isUser ? 'primary.main' : 'secondary.main',
            }}
          >
            {isUser ? <Person /> : <Psychology />}
          </Avatar>
        </ListItemAvatar>
        <Box
          sx={{
            maxWidth: '70%',
            ml: isUser ? 0 : 1,
            mr: isUser ? 1 : 0,
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 2,
              bgcolor: isUser ? 'primary.main' : 'grey.100',
              color: isUser ? 'white' : 'text.primary',
              borderRadius: 2,
              '&:first-of-type': {
                borderTopLeftRadius: isUser ? 2 : 0,
                borderTopRightRadius: isUser ? 0 : 2,
              },
            }}
          >
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </Paper>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              mt: 0.5,
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {format(new Date(message.created_at), 'HH:mm')}
            {message.tokens_used > 0 && ` • ${message.tokens_used} tokens`}
          </Typography>
        </Box>
      </ListItem>
    </motion.div>
  );
};

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<number | ''>('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const { models, sendMessage, isSendingMessage } = useLLM();
  const { conversation, messages, isLoading, error } = useConversation(
    conversationId ? parseInt(conversationId) : 0
  );

  useEffect(() => {
    if (conversation?.model) {
      setSelectedModel(conversation.model);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSendingMessage || isStreaming) return;

    const messageText = message.trim();
    setMessage('');

    try {
      if (selectedModel) {
        const chatRequest: ChatRequest = {
          message: messageText,
          conversation_id: conversationId ? parseInt(conversationId) : undefined,
          model_id: selectedModel as number,
          temperature,
          max_tokens: maxTokens,
          system_prompt: systemPrompt || undefined,
          stream: false,
        };

        await sendMessage(chatRequest);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessage('');
    setStreamingMessage('');
    setIsStreaming(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading conversation: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {conversation?.title || 'New Chat'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setShowSettings(!showSettings)}>
              <Settings />
            </IconButton>
            <IconButton onClick={clearChat}>
              <Clear />
            </IconButton>
          </Box>
        </Box>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Accordion expanded={showSettings} sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Chat Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Model</InputLabel>
                      <Select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as number)}
                        label="Model"
                      >
                        {models.map((model) => (
                          <MenuItem key={model.id} value={model.id}>
                            {model.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box>
                      <Typography gutterBottom>
                        Temperature: {temperature}
                      </Typography>
                      <Slider
                        value={temperature}
                        onChange={(_, value) => setTemperature(value as number)}
                        min={0}
                        max={2}
                        step={0.1}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 1, label: '1' },
                          { value: 2, label: '2' },
                        ]}
                      />
                    </Box>

                    <Box>
                      <Typography gutterBottom>
                        Max Tokens: {maxTokens}
                      </Typography>
                      <Slider
                        value={maxTokens}
                        onChange={(_, value) => setMaxTokens(value as number)}
                        min={100}
                        max={8192}
                        step={100}
                        marks={[
                          { value: 100, label: '100' },
                          { value: 2048, label: '2048' },
                          { value: 8192, label: '8192' },
                        ]}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      label="System Prompt (Optional)"
                      multiline
                      rows={2}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      size="small"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>

      {/* Messages */}
      <Paper
        elevation={1}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
          mb: 2,
        }}
      >
        <List sx={{ p: 0 }}>
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isUser={msg.role === 'user'}
              />
            ))}
          </AnimatePresence>

          {/* Streaming message */}
          {isStreaming && streamingMessage && (
            <MessageBubble
              message={{
                id: 0,
                role: 'assistant',
                content: streamingMessage,
                tokens_used: 0,
                created_at: new Date().toISOString(),
                metadata: {},
              }}
              isUser={false}
            />
          )}

          {/* Loading indicator */}
          {isSendingMessage && (
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <Psychology />
                </Avatar>
              </ListItemAvatar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Thinking...
                </Typography>
              </Box>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Paper>

      {/* Input */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSendingMessage || isStreaming}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() || isSendingMessage || isStreaming || !selectedModel}
            sx={{ alignSelf: 'flex-end' }}
          >
            <Send />
          </IconButton>
        </Box>
        {!selectedModel && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            Please select a model to start chatting
          </Typography>
        )}
      </Paper>
    </Box>
  );
};
