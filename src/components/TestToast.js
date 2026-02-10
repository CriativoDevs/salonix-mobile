import React from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";
import { Button } from "./ui/Button";
import { useToast } from "../contexts/ToastContext";

export default function TestToast() {
  const { showToast } = useToast();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Button
          variant="primary"
          onPress={() =>
            showToast({
              message: "Operação realizada com sucesso!",
              type: "success",
            })
          }
          style={styles.button}
        >
          Toast Success
        </Button>

        <Button
          variant="primary"
          onPress={() =>
            showToast({
              message: "Erro ao processar solicitação",
              type: "error",
            })
          }
          style={styles.button}
        >
          Toast Error
        </Button>

        <Button
          variant="primary"
          onPress={() =>
            showToast({
              message: "Atenção: Esta ação não pode ser desfeita",
              type: "warning",
            })
          }
          style={styles.button}
        >
          Toast Warning
        </Button>

        <Button
          variant="primary"
          onPress={() =>
            showToast({
              message: "Informação importante sobre o sistema",
              type: "info",
            })
          }
          style={styles.button}
        >
          Toast Info
        </Button>

        <Button
          variant="secondary"
          onPress={() => {
            showToast({ message: "Toast 1", type: "success" });
            setTimeout(
              () => showToast({ message: "Toast 2", type: "info" }),
              500,
            );
            setTimeout(
              () => showToast({ message: "Toast 3", type: "warning" }),
              1000,
            );
          }}
          style={styles.button}
        >
          Múltiplos Toasts
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  button: {
    width: "100%",
  },
});
