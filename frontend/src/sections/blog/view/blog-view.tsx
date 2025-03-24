import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import { _posts } from 'src/_mock/blog'; // Updated import path
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { PostItem } from '../post-item';
import { PostSort } from '../post-sort';
import { PostSearch } from '../post-search';

// ----------------------------------------------------------------------

// Add a type definition for the post item
export type PostItemProps = {
  id: string;
  title: string;
  coverUrl: string;
  totalViews: number;
  description: string;
  totalShares: number;
  totalComments: number;
  totalFavorites: number;
  postedAt: string | number | null;
  categories?: string[];
  author: {
    name: string;
    avatarUrl: string;
  };
};

// Blog categories with icons
const BLOG_CATEGORIES = [
  { name: 'All', icon: 'solar:document-bold' },
  { name: 'Saving Tips', icon: 'solar:dollar-minimalistic-bold' },
  { name: 'Road Trips', icon: 'solar:map-bold' },
  { name: 'Car Features', icon: 'solar:car-bold' },
  { name: 'Safety', icon: 'solar:shield-check-bold' },
];

export function BlogView() {
  const [sortBy, setSortBy] = useState('latest');
  const [category, setCategory] = useState('All');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 8;

  const handleSort = useCallback((newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page on sort change
  }, []);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setCurrentPage(1); // Reset to first page on category change
  };

  const handleNewPost = () => {
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // Filter posts by category
  const filteredPosts = _posts.filter((post) => {
    if (category === 'All') return true;
    return post.categories?.includes(category);
  });

  // Sort filtered posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
    }
    if (sortBy === 'popular') {
      return b.totalViews - a.totalViews;
    }
    return 0;
  });

  // Paginate posts
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = sortedPosts.slice(indexOfFirstPost, indexOfLastPost);
  const pageCount = Math.ceil(sortedPosts.length / postsPerPage);

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Car Rental Blog
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleNewPost}
        >
          New post
        </Button>
      </Box>

      <Box mb={4}>
        <Alert severity="info">
          Our blog provides helpful tips and information for car rental customers. Browse our articles for rental advice, road trip ideas, and industry news.
        </Alert>
      </Box>

      {/* Category chips */}
      <Box mb={4}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {BLOG_CATEGORIES.map((cat) => (
            <Chip
              key={cat.name}
              icon={<Iconify icon={cat.icon} width={16} />}
              label={cat.name}
              onClick={() => handleCategoryChange(cat.name)}
              color={category === cat.name ? 'primary' : 'default'}
              variant={category === cat.name ? 'filled' : 'outlined'}
              sx={{ m: 0.5 }}
            />
          ))}
        </Stack>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {category === 'All' ? 'All articles' : `Category: ${category}`} ({filteredPosts.length})
          </Typography>
        </Box>
        <PostSort
          sortBy={sortBy}
          onSort={handleSort}
          options={[
            { value: 'latest', label: 'Latest' },
            { value: 'popular', label: 'Popular' },
            { value: 'oldest', label: 'Oldest' },
          ]}
        />
      </Box>

      {currentPosts.length > 0 ? (
        <Grid container spacing={3}>
          {currentPosts.map((post, index) => {
            const latestPostLarge = index === 0 && currentPage === 1;
            const latestPost = (index === 1 || index === 2) && currentPage === 1;

            return (
              <Grid key={post.id} xs={12} sm={latestPostLarge ? 12 : 6} md={latestPostLarge ? 6 : 3}>
                <PostItem post={post} latestPost={latestPost} latestPostLarge={latestPostLarge} />
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" paragraph>
            No posts found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No articles match the selected category. Try another category.
          </Typography>
        </Box>
      )}

      {pageCount > 1 && (
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          sx={{ mt: 8, mx: 'auto' }}
        />
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Blog post creation is under development"
      />
    </DashboardContent>
  );
}