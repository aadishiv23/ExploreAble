// ExerciseButtons.tsx
import React from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import { ExerciseType } from "./ExerciseTypes"; // Import the enum

interface Props {
  onExerciseSelect: (exercise: ExerciseType) => void;
}

const ExerciseButtons: React.FC<Props> = ({ onExerciseSelect }) => {
  return (
    <View style={styles.container}>
      {Object.values(ExerciseType).map((exerciseType) => (
        <Button
          key={exerciseType}
          title={exerciseType}
          onPress={() => onExerciseSelect(exerciseType)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 10,
  },
});

export default ExerciseButtons;
