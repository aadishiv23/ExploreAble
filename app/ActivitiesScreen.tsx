import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

type IoniconName = keyof typeof Ionicons.glyphMap;

const activities: { id: string; title: string; duration: string; participants: number; icon: IoniconName; color: string }[] = [
  { id: "1", title: "Morning Run", duration: "30 min", participants: 5, icon: "walk", color: "#A0C4FF" },
  { id: "2", title: "Group Hike", duration: "45 min", participants: 8, icon: "fitness", color: "#DAB6FC" },
  { id: "3", title: "Gym Workout", duration: "60 min", participants: 2, icon: "barbell", color: "#FFC6C6" },
];

const Filters = ["All", "Running", "Cycling", "WeightLifting"];

const ActivitiesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Activities</Text>
      <View style={styles.filterContainer}>
        {Filters.map((filter, index) => (
          <TouchableOpacity key={index} style={[styles.filterButton, index === 0 && styles.selectedFilter]}>
            <Text style={[styles.filterText, index === 0 && styles.selectedFilterText]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.activityCard, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon} size={24} color="black" />
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityInfo}>{item.duration} | 👥 {item.participants}</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>Create Group Activity</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  filterContainer: { flexDirection: "row", marginBottom: 15 },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 10,
  },
  selectedFilter: { backgroundColor: "#007AFF" },
  filterText: { fontSize: 14, color: "#555" },
  selectedFilterText: { color: "white" },
  activityCard: {
    flexDirection: "column",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  activityTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 5 },
  activityInfo: { fontSize: 14, color: "#333" },
  createButton: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  createButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
