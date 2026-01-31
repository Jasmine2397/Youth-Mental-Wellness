import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ForumCard, { categoryConfig } from '@/components/community/ForumCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Shield,
  Users,
  Loader2,
  ArrowLeft,
  Send,
  Home
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const anonymousNames = [
  'Gentle Cloud', 'Quiet River', 'Soft Moon', 'Warm Breeze', 'Bright Star',
  'Calm Wave', 'Kind Heart', 'Peaceful Mind', 'Brave Soul', 'Hopeful Light',
  'Silent Storm', 'Tender Leaf', 'Wise Owl', 'Swift Fox', 'Steady Mountain'
];

const getRandomName = () => 
  anonymousNames[Math.floor(Math.random() * anonymousNames.length)];

export default function Community() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['forumPosts', selectedCategory],
    queryFn: () => selectedCategory === 'all' 
      ? base44.entities.ForumPost.list('-created_date')
      : base44.entities.ForumPost.filter({ category: selectedCategory }, '-created_date')
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['forumComments', selectedPost?.id],
    queryFn: () => base44.entities.ForumComment.filter({ post_id: selectedPost.id }, 'created_date'),
    enabled: !!selectedPost
  });

  const createPost = useMutation({
    mutationFn: (data) => base44.entities.ForumPost.create({
      ...data,
      anonymous_name: getRandomName(),
      reactions: { heart: 0, hug: 0, same: 0, strength: 0 }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['forumPosts']);
      setIsCreateOpen(false);
      setNewPost({ title: '', content: '', category: 'general' });
    }
  });

  const createComment = useMutation({
    mutationFn: (data) => base44.entities.ForumComment.create({
      ...data,
      anonymous_name: getRandomName(),
      reactions: { heart: 0, hug: 0 }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['forumComments']);
      setNewComment('');
    }
  });

  const updateReaction = useMutation({
    mutationFn: ({ id, reactions }) => base44.entities.ForumPost.update(id, { reactions }),
    onSuccess: () => queryClient.invalidateQueries(['forumPosts'])
  });

  const handleReact = (postId, reactionType) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      const newReactions = {
        ...post.reactions,
        [reactionType]: (post.reactions?.[reactionType] || 0) + 1
      };
      updateReaction.mutate({ id: postId, reactions: newReactions });
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Post Detail View
  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-rose-50 p-6">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => setSelectedPost(null)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Community</span>
          </button>

          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl">
                  {categoryConfig[selectedPost.category]?.icon || '💬'}
                </div>
                <div>
                  <span className="font-medium text-slate-700">{selectedPost.anonymous_name}</span>
                  <p className="text-sm text-slate-500">
                    {formatDistanceToNow(new Date(selectedPost.created_date), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-800 mb-4">{selectedPost.title}</h1>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
            </CardContent>
          </Card>

          {/* Comments */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-slate-700">
              Responses ({comments.length})
            </h3>
            
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <span className="text-sm">💭</span>
                      </div>
                      <span className="text-sm font-medium text-slate-600">{comment.anonymous_name}</span>
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-slate-700">{comment.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Add Comment */}
          <Card>
            <CardContent className="p-5">
              <div className="flex gap-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your support or thoughts..."
                  className="flex-1 min-h-[80px] resize-none"
                />
                <Button
                  onClick={() => createComment.mutate({
                    post_id: selectedPost.id,
                    content: newComment
                  })}
                  disabled={!newComment.trim() || createComment.isPending}
                  className="bg-gradient-to-r from-violet-500 to-violet-600 self-end"
                >
                  {createComment.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-rose-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Subtle Back Navigation */}
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 rounded-full mb-4">
              <Users className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-700">Anonymous Community</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-3">
              You're Not Alone
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Connect with others who understand. Share your story, find support, 
              and know that someone else has been there too.
            </p>
          </motion.div>
        </div>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 mb-8 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-teal-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-700">Your privacy is protected</h3>
            <p className="text-sm text-slate-500">
              All posts are anonymous. Your real identity is never shared.
            </p>
          </div>
        </motion.div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="pl-12 h-12 rounded-xl border-slate-200"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.icon} {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                Share Your Story
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Share Your Story</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Topic
                  </label>
                  <Select 
                    value={newPost.category} 
                    onValueChange={(v) => setNewPost({...newPost, category: v})}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.icon} {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Title
                  </label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    placeholder="Give your post a title..."
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    What's on your mind?
                  </label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    placeholder="Share as much or as little as you'd like..."
                    className="min-h-[150px] rounded-xl resize-none"
                  />
                </div>
                <Button
                  onClick={() => createPost.mutate(newPost)}
                  disabled={!newPost.title.trim() || !newPost.content.trim() || createPost.isPending}
                  className="w-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl"
                >
                  {createPost.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Post Anonymously
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500">No posts yet. Be the first to share your story.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <ForumCard
                key={post.id}
                post={post}
                onClick={() => setSelectedPost(post)}
                onReact={handleReact}
                commentCount={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}