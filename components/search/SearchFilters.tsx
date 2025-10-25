/**
 * SearchFilters Component
 * Filter search results by person, date, chat, priority
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export interface SearchFiltersState {
  chatId?: string;
  senderId?: string;
  dateFrom?: number;
  dateTo?: number;
  priorityOnly?: boolean;
  hasActionItems?: boolean;
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  availableChats?: Array<{ id: string; name: string }>;
  availableUsers?: Array<{ id: string; name: string }>;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  availableChats = [],
  availableUsers = [],
}: SearchFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChatPicker, setShowChatPicker] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);

  const hasActiveFilters = 
    filters.chatId || 
    filters.senderId || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.priorityOnly || 
    filters.hasActionItems;

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const togglePriorityFilter = () => {
    onFiltersChange({
      ...filters,
      priorityOnly: !filters.priorityOnly,
    });
  };

  const toggleActionItemsFilter = () => {
    onFiltersChange({
      ...filters,
      hasActionItems: !filters.hasActionItems,
    });
  };

  const setDateRange = (range: 'today' | 'week' | 'month' | 'all') => {
    const now = Date.now();
    let dateFrom: number | undefined;

    switch (range) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateFrom = today.getTime();
        break;
      case 'week':
        dateFrom = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        dateFrom = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
        dateFrom = undefined;
        break;
    }

    onFiltersChange({
      ...filters,
      dateFrom,
      dateTo: range === 'all' ? undefined : now,
    });
  };

  const selectChat = (chatId: string | undefined) => {
    onFiltersChange({
      ...filters,
      chatId,
    });
    setShowChatPicker(false);
  };

  const selectUser = (userId: string | undefined) => {
    onFiltersChange({
      ...filters,
      senderId: userId,
    });
    setShowUserPicker(false);
  };

  const getDateRangeLabel = () => {
    if (!filters.dateFrom) return 'All time';
    const daysDiff = Math.floor((Date.now() - filters.dateFrom) / (24 * 60 * 60 * 1000));
    if (daysDiff === 0) return 'Today';
    if (daysDiff <= 7) return 'Past week';
    if (daysDiff <= 30) return 'Past month';
    return 'Custom range';
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      >
        {/* Date Range Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            (filters.dateFrom || filters.dateTo) && styles.filterChipActive,
          ]}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <Ionicons 
            name="calendar-outline" 
            size={16} 
            color={(filters.dateFrom || filters.dateTo) ? '#FFF' : '#007AFF'} 
          />
          <Text style={[
            styles.filterText,
            (filters.dateFrom || filters.dateTo) && styles.filterTextActive,
          ]}>
            {getDateRangeLabel()}
          </Text>
        </TouchableOpacity>

        {/* Chat Filter */}
        {availableChats.length > 0 && (
          <TouchableOpacity
            style={[
              styles.filterChip,
              filters.chatId && styles.filterChipActive,
            ]}
            onPress={() => setShowChatPicker(!showChatPicker)}
          >
            <Ionicons 
              name="chatbubble-outline" 
              size={16} 
              color={filters.chatId ? '#FFF' : '#007AFF'} 
            />
            <Text style={[
              styles.filterText,
              filters.chatId && styles.filterTextActive,
            ]}>
              {filters.chatId 
                ? availableChats.find(c => c.id === filters.chatId)?.name || 'Chat'
                : 'All chats'
              }
            </Text>
          </TouchableOpacity>
        )}

        {/* User Filter */}
        {availableUsers.length > 0 && (
          <TouchableOpacity
            style={[
              styles.filterChip,
              filters.senderId && styles.filterChipActive,
            ]}
            onPress={() => setShowUserPicker(!showUserPicker)}
          >
            <Ionicons 
              name="person-outline" 
              size={16} 
              color={filters.senderId ? '#FFF' : '#007AFF'} 
            />
            <Text style={[
              styles.filterText,
              filters.senderId && styles.filterTextActive,
            ]}>
              {filters.senderId 
                ? availableUsers.find(u => u.id === filters.senderId)?.name || 'Person'
                : 'Anyone'
              }
            </Text>
          </TouchableOpacity>
        )}

        {/* Priority Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.priorityOnly && styles.filterChipActive,
          ]}
          onPress={togglePriorityFilter}
        >
          <Ionicons 
            name="alert-circle-outline" 
            size={16} 
            color={filters.priorityOnly ? '#FFF' : '#007AFF'} 
          />
          <Text style={[
            styles.filterText,
            filters.priorityOnly && styles.filterTextActive,
          ]}>
            Priority only
          </Text>
        </TouchableOpacity>

        {/* Action Items Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.hasActionItems && styles.filterChipActive,
          ]}
          onPress={toggleActionItemsFilter}
        >
          <Ionicons 
            name="checkbox-outline" 
            size={16} 
            color={filters.hasActionItems ? '#FFF' : '#007AFF'} 
          />
          <Text style={[
            styles.filterText,
            filters.hasActionItems && styles.filterTextActive,
          ]}>
            Has action items
          </Text>
        </TouchableOpacity>

        {/* Clear All */}
        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllFilters}
          >
            <Ionicons name="close-circle" size={16} color="#999" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Date Picker Dropdown */}
      {showDatePicker && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setDateRange('today');
              setShowDatePicker(false);
            }}
          >
            <Text style={styles.dropdownText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setDateRange('week');
              setShowDatePicker(false);
            }}
          >
            <Text style={styles.dropdownText}>Past week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setDateRange('month');
              setShowDatePicker(false);
            }}
          >
            <Text style={styles.dropdownText}>Past month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setDateRange('all');
              setShowDatePicker(false);
            }}
          >
            <Text style={styles.dropdownText}>All time</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Picker Dropdown */}
      {showChatPicker && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => selectChat(undefined)}
          >
            <Text style={styles.dropdownText}>All chats</Text>
          </TouchableOpacity>
          {availableChats.map(chat => (
            <TouchableOpacity
              key={chat.id}
              style={styles.dropdownItem}
              onPress={() => selectChat(chat.id)}
            >
              <Text style={styles.dropdownText}>{chat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* User Picker Dropdown */}
      {showUserPicker && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => selectUser(undefined)}
          >
            <Text style={styles.dropdownText}>Anyone</Text>
          </TouchableOpacity>
          {availableUsers.map(user => (
            <TouchableOpacity
              key={user.id}
              style={styles.dropdownItem}
              onPress={() => selectUser(user.id)}
            >
              <Text style={styles.dropdownText}>{user.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFF',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    gap: 6,
  },
  clearText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  dropdown: {
    position: 'absolute',
    top: 56,
    left: 12,
    right: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 250,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
});

