import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Chat,
  Psychology,
  History,
  TrendingUp,
  Add,
  ArrowForward,
  Person,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLLM } from '@/hooks/useLLM';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}> = ({ title, description, icon, onClick, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Avatar
          sx={{
            bgcolor: color,
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  </motion.div>
);

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { models, conversations, isLoadingModels, isLoadingConversations } = useLLM();

  const recentConversations = conversations.slice(0, 5);
  const activeModels = models.filter(model => model.is_active);

  const quickActions = [
    {
      title: 'New Chat',
      description: 'Start a new conversation with AI',
      icon: <Chat />,
      color: '#1976d2',
      onClick: () => navigate('/chat'),
    },
    {
      title: 'Browse Models',
      description: 'Explore available AI models',
      icon: <Psychology />,
      color: '#9c27b0',
      onClick: () => navigate('/models'),
    },
    {
      title: 'View History',
      description: 'See your conversation history',
      icon: <History />,
      color: '#f57c00',
      onClick: () => navigate('/conversations'),
    },
  ];

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.first_name || 'User'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your LLM conversations today.
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Conversations"
            value={conversations.length}
            icon={<Chat />}
            color="#1976d2"
            subtitle="All time"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Models"
            value={activeModels.length}
            icon={<Psychology />}
            color="#9c27b0"
            subtitle="Available now"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Messages Today"
            value="0"
            icon={<TrendingUp />}
            color="#2e7d32"
            subtitle="This session"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value="99.9%"
            icon={<TrendingUp />}
            color="#f57c00"
            subtitle="Response accuracy"
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Quick Actions
            </Typography>
          </motion.div>
        </Grid>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={action.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            >
              <QuickActionCard {...action} />
            </motion.div>
          </Grid>
        ))}

        {/* Recent Conversations */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h3">
                  Recent Conversations
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/conversations')}
                >
                  View All
                </Button>
              </Box>
              {isLoadingConversations ? (
                <LinearProgress />
              ) : recentConversations.length > 0 ? (
                <List>
                  {recentConversations.map((conversation) => (
                    <ListItem key={conversation.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <Chat />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={conversation.title}
                        secondary={`${conversation.message_count} messages • ${conversation.model_name}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/chat/${conversation.id}`)}
                        >
                          <ArrowForward />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Chat sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No conversations yet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/chat')}
                    sx={{ mt: 2 }}
                  >
                    Start Your First Chat
                  </Button>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Grid>

        {/* Available Models */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h3">
                  Available Models
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/models')}
                >
                  View All
                </Button>
              </Box>
              {isLoadingModels ? (
                <LinearProgress />
              ) : activeModels.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {activeModels.slice(0, 6).map((model) => (
                    <Chip
                      key={model.id}
                      label={model.name}
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => navigate('/models')}
                    />
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Psychology sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No models available
                  </Typography>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};
