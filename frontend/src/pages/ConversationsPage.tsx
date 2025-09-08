import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Archive,
  Unarchive,
  Delete,
  Chat,
  Psychology,
  AccessTime,
  Message,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLLM } from '@/hooks/useLLM';
import { Conversation } from '@/types';
import { format } from 'date-fns';

const ConversationCard: React.FC<{
  conversation: Conversation;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onOpen: () => void;
}> = ({ conversation, onArchive, onUnarchive, onDelete, onOpen }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          mb: 2,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
          },
        }}
        onClick={onOpen}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" component="h3" noWrap gutterBottom>
                {conversation.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  icon={<Psychology />}
                  label={conversation.model_name}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  icon={<Message />}
                  label={`${conversation.message_count} messages`}
                  size="small"
                  variant="outlined"
                />
                {conversation.is_archived && (
                  <Chip
                    icon={<Archive />}
                    label="Archived"
                    size="small"
                    color="secondary"
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" noWrap>
                <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                {format(new Date(conversation.updated_at), 'MMM dd, yyyy HH:mm')}
              </Typography>
            </Box>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e);
              }}
              size="small"
            >
              <MoreVert />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => handleAction(onOpen)}>
          <Chat sx={{ mr: 1 }} />
          Open
        </MenuItem>
        {conversation.is_archived ? (
          <MenuItem onClick={() => handleAction(onUnarchive)}>
            <Unarchive sx={{ mr: 1 }} />
            Unarchive
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleAction(onArchive)}>
            <Archive sx={{ mr: 1 }} />
            Archive
          </MenuItem>
        )}
        <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

export const ConversationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  const {
    conversations,
    isLoadingConversations,
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
    searchConversations,
    isArchivingConversation,
    isUnarchivingConversation,
    isDeletingConversation,
    isSearchingConversations,
  } = useLLM();

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'archived') return conv.is_archived;
    if (filter === 'active') return !conv.is_archived;
    return true;
  });

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchConversations(searchQuery);
    }
  };

  const handleOpenConversation = (conversation: Conversation) => {
    navigate(`/chat/${conversation.id}`);
  };

  const handleArchive = async (conversation: Conversation) => {
    await archiveConversation(conversation.id);
  };

  const handleUnarchive = async (conversation: Conversation) => {
    await unarchiveConversation(conversation.id);
  };

  const handleDeleteClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedConversation) {
      await deleteConversation(selectedConversation.id);
      setDeleteDialogOpen(false);
      setSelectedConversation(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedConversation(null);
  };

  if (isLoadingConversations) {
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
            Conversations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your chat history and conversations
          </Typography>
        </Box>
      </motion.div>

      {/* Search and Filters */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant={filter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilter('all')}
            >
              All ({conversations.length})
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant={filter === 'active' ? 'contained' : 'outlined'}
              onClick={() => setFilter('active')}
            >
              Active ({conversations.filter(c => !c.is_archived).length})
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <List>
          {filteredConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              onOpen={() => handleOpenConversation(conversation)}
              onArchive={() => handleArchive(conversation)}
              onUnarchive={() => handleUnarchive(conversation)}
              onDelete={() => handleDeleteClick(conversation)}
            />
          ))}
        </List>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Chat sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {filter === 'archived' ? 'No archived conversations' : 'No conversations found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {filter === 'archived' 
                ? 'Archived conversations will appear here'
                : 'Start a new conversation to see it here'
              }
            </Typography>
            {filter !== 'archived' && (
              <Button
                variant="contained"
                startIcon={<Chat />}
                onClick={() => navigate('/chat')}
              >
                Start New Chat
              </Button>
            )}
          </Paper>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedConversation?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeletingConversation}
          >
            {isDeletingConversation ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
