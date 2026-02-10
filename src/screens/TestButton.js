import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Button } from "../components/ui/Button";

export default function TestButton() {
  const [loading, setLoading] = useState(false);

  const handlePress = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-semibold text-brand-surfaceForeground mb-6">
          Test Button Components
        </Text>

        {/* Variant: link (PADRÃO - 90% dos casos) */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-600 mb-3">
            Variant: link (PADRÃO - 90% dos botões no FEW)
          </Text>
          <Button
            variant="link"
            onPress={handlePress}
          >
            Entrar
          </Button>
          <Button
            variant="link"
            onPress={handlePress}
            loading={loading}
            className="mt-2"
          >
            Enviando...
          </Button>
          <Button
            variant="link"
            disabled
            className="mt-2"
          >
            Desabilitado
          </Button>
        </View>

        {/* Variant: primary (5% dos casos - CTAs críticos) */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-600 mb-3">
            Variant: primary (CTAs críticos - 5% dos casos)
          </Text>
          <Button
            variant="primary"
            onPress={handlePress}
          >
            Confirmar Agendamento
          </Button>
          <Button
            variant="primary"
            onPress={handlePress}
            loading={loading}
            className="mt-2"
          >
            Processando...
          </Button>
          <Button
            variant="primary"
            disabled
            className="mt-2"
          >
            Desabilitado
          </Button>
        </View>

        {/* Variant: secondary (5% dos casos - cancelar, voltar) */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-600 mb-3">
            Variant: secondary (Cancelar, voltar - 5% dos casos)
          </Text>
          <Button
            variant="secondary"
            onPress={handlePress}
          >
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onPress={handlePress}
            loading={loading}
            className="mt-2"
          >
            Aguarde...
          </Button>
          <Button
            variant="secondary"
            disabled
            className="mt-2"
          >
            Desabilitado
          </Button>
        </View>

        {/* Tamanhos */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-600 mb-3">
            Tamanhos (sm, md, lg)
          </Text>
          <Button
            variant="primary"
            size="sm"
            onPress={handlePress}
          >
            Small (px-3 py-1.5)
          </Button>
          <Button
            variant="primary"
            size="md"
            onPress={handlePress}
            className="mt-2"
          >
            Medium (px-4 py-2) - Padrão
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={handlePress}
            className="mt-2"
          >
            Large (px-5 py-2.5)
          </Button>
        </View>

        {/* Uso Real (como no FEW ClientEnter.jsx) */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-600 mb-3">
            Uso Real (LoginScreen)
          </Text>
          <View className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <Text className="text-sm text-gray-500 mb-2">
              Este é o padrão usado em 90% dos casos no FEW:
            </Text>
            <Button
              variant="link"
              onPress={handlePress}
            >
              Entrar
            </Button>
          </View>
        </View>

        <Text className="text-xs text-gray-400 mt-4">
          ✅ Baseado no DESIGN_SYSTEM.md
          {"\n"}✅ Cores exatas: #3b82f6 (primary), #0f172a (text)
          {"\n"}✅ Tamanhos exatos: px-3, px-4, px-5
          {"\n"}✅ variant="link" é o padrão (90% dos botões)
        </Text>
      </View>
    </ScrollView>
  );
}
