// App.tsx
import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, StyleSheet } from "react-native";
import { createClient } from "@supabase/supabase-js";
import ExerciseButtons from "./ExerciseButtons";

const supabaseUrl = "https://rfgxwslemuautusuecrs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZ3h3c2xlbXVhdXR1c3VlY3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0Mzg0MjUsImV4cCI6MjA0NTAxNDQyNX0.hc3cIW6UCBIFf_54bldNEPBkak8IySOmbKMJXe8de1g";
const supabase = createClient(supabaseUrl, supabaseKey);

const App: React.FC = () => {
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchExerciseTypes = async () => {
      try {
        const { data, error } = await supabase
          .from("Posts")
          .select("exercise_type")
          .distinct();
        if (error) throw error;
        const types = data?.map((item) => item.exercise_type) || [];
        setExerciseTypes(types);
      } catch (error) {
        console.error("Error fetching exercise types:", error);
      }
    }

    fetchExerciseTypes();
  }, []);
  
  const handleExerciseSelect = (exerciseType: string) => {
    console.log("Selected exercise type:", exerciseType);
    // You can do something with the selected exercise type here
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select an Exercise</Text>
      <ExerciseButtons onExerciseSelect={handleExerciseSelect} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default App;
