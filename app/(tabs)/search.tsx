/**
 * Search Screen
 * Search across messages, chats, and users
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { searchService, SearchResult, SearchFilters as SearchFiltersType } from '@/services/search/SearchService';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchFilters } from '@/components/search/SearchFilters';

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult>({
    messages: [],
    chats: [],
    users: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [showFilters, setShowFilters] = useState(false);
  const [forceAI, setForceAI] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    const queryChanged = query !== searchQuery;
    setSearchQuery(query);

    // Reset forceAI when query changes
    if (queryChanged) {
      setForceAI(false);
    }

    if (!user || !query || query.trim().length < 2) {
      setResults({
        messages: [],
        chats: [],
        users: [],
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Use forceAI only if query hasn't changed (user clicked "Use AI" button)
      // If query changed, ignore forceAI to let searchAll decide based on query type
      const shouldForceAI = queryChanged ? false : forceAI;
      const searchResults = await searchService.searchAll(query, user.uid, filters, shouldForceAI);
      setResults(searchResults);

      // Save to search history
      if (query.trim().length >= 2) {
        await searchService.saveSearchQuery(user.uid, query);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({
        messages: [],
        chats: [],
        users: [],
      });
    } finally {
      setLoading(false);
    }
  }, [user, filters, forceAI]);

  const handleFiltersChange = useCallback((newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    // Re-run search with new filters if there's a query
    if (searchQuery && searchQuery.trim().length >= 2) {
      handleSearch(searchQuery, true);
    }
  }, [searchQuery, handleSearch]);

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with back button and search bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.searchBarContainer}>
            <SearchBar
              placeholder="Search contacts, chats, or ask a question..."
              onSearch={handleSearch}
              debounceMs={500}
              autoFocus={true}
            />
          </View>

          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Ionicons
              name={showFilters ? 'funnel' : 'funnel-outline'}
              size={24}
              color={Object.keys(filters).length > 0 ? '#007AFF' : '#666'}
            />
          </TouchableOpacity>
        </View>

        {/* Search Mode Badge */}
        {searchQuery && (
          <View style={styles.searchModeBadge}>
            {forceAI || searchQuery.toLowerCase().match(/^(what|when|where|who|why|how|which|whose)/) || searchQuery.includes('?') ? (
              <>
                <Ionicons name="sparkles" size={14} color="#007AFF" />
                <Text style={styles.searchModeText}>AI semantic search</Text>
              </>
            ) : (
              <>
                <Ionicons name="flash" size={14} color="#34C759" />
                <Text style={[styles.searchModeText, { color: '#34C759' }]}>Fast keyword search</Text>
              </>
            )}
            {!forceAI && !searchQuery.match(/^(what|when|where|who|why|how|which|whose)/) && !searchQuery.includes('?') && (
              <TouchableOpacity
                onPress={() => setForceAI(true)}
                style={styles.switchModeButton}
              >
                <Text style={styles.switchModeText}>Use AI</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Filters */}
        {showFilters && (
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        )}

        {/* Results */}
        <SearchResults
          results={results}
          loading={loading}
          searchQuery={searchQuery}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  searchBarContainer: {
    flex: 1,
  },
  filterButton: {
    padding: 8,
  },
  searchModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F8FF',
    gap: 6,
  },
  searchModeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  switchModeButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  switchModeText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
});

