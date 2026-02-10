import React, { useState } from "react";
import { View, Text, SafeAreaView, ScrollView } from "react-native";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";

export default function TestAlert() {
  // Estados para controlar visibilidade dos alerts closable
  const [showInfoClosable, setShowInfoClosable] = useState(true);
  const [showSuccessClosable, setShowSuccessClosable] = useState(true);
  const [showWarningClosable, setShowWarningClosable] = useState(true);
  const [showErrorClosable, setShowErrorClosable] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          Teste de Alert
        </Text>
        <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
          Alerts inline para feedback contextual. Teste os 4 tipos e variações.
        </Text>

        {/* Seção 1: Alerts básicos (sem título) */}
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a" }}>
            1. Alerts Básicos (sem título)
          </Text>

          <Alert
            type="info"
            message="Esta é uma mensagem informativa. Use para dicas e informações gerais."
          />

          <Alert
            type="success"
            message="Operação realizada com sucesso! Use para confirmações positivas."
          />

          <Alert
            type="warning"
            message="Atenção: Esta ação pode ter consequências. Use para avisos importantes."
          />

          <Alert
            type="error"
            message="Erro ao processar a solicitação. Tente novamente mais tarde."
          />
        </View>

        {/* Seção 2: Alerts com título */}
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a" }}>
            2. Alerts com Título
          </Text>

          <Alert
            type="info"
            title="Informação"
            message="Você pode adicionar títulos aos alerts para melhor contexto."
          />

          <Alert
            type="success"
            title="Agendamento Confirmado"
            message="Seu agendamento foi confirmado para 15/02/2026 às 14:00."
          />

          <Alert
            type="warning"
            title="Pagamento Pendente"
            message="Você tem 3 faturas pendentes. Regularize para evitar bloqueio."
          />

          <Alert
            type="error"
            title="Falha na Conexão"
            message="Não foi possível conectar ao servidor. Verifique sua internet."
          />
        </View>

        {/* Seção 3: Alerts closable (podem ser fechados) */}
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a" }}>
            3. Alerts Closable (podem ser fechados)
          </Text>

          {showInfoClosable && (
            <Alert
              type="info"
              title="Dica"
              message="Clique no X para fechar este alert. Útil para mensagens temporárias."
              closable
              onClose={() => setShowInfoClosable(false)}
            />
          )}

          {showSuccessClosable && (
            <Alert
              type="success"
              title="Novo Recurso"
              message="Agora você pode editar agendamentos diretamente na lista!"
              closable
              onClose={() => setShowSuccessClosable(false)}
            />
          )}

          {showWarningClosable && (
            <Alert
              type="warning"
              title="Manutenção Programada"
              message="Sistema em manutenção amanhã das 02:00 às 04:00."
              closable
              onClose={() => setShowWarningClosable(false)}
            />
          )}

          {showErrorClosable && (
            <Alert
              type="error"
              title="Sessão Expirada"
              message="Sua sessão expirou. Faça login novamente para continuar."
              closable
              onClose={() => setShowErrorClosable(false)}
            />
          )}

          {/* Botão para resetar alerts fechados */}
          {(!showInfoClosable ||
            !showSuccessClosable ||
            !showWarningClosable ||
            !showErrorClosable) && (
            <Button
              variant="secondary"
              onPress={() => {
                setShowInfoClosable(true);
                setShowSuccessClosable(true);
                setShowWarningClosable(true);
                setShowErrorClosable(true);
              }}
            >
              Mostrar Todos os Alerts Novamente
            </Button>
          )}
        </View>

        {/* Seção 4: Exemplos de uso real */}
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a" }}>
            4. Casos de Uso Reais
          </Text>

          <Alert
            type="success"
            title="Bem-vindo de volta!"
            message="Último acesso: 09/02/2026 às 18:30"
          />

          <Alert
            type="warning"
            message="Você tem 2 agendamentos conflitantes. Revise sua agenda."
          />

          <Alert
            type="error"
            title="Créditos Insuficientes"
            message="Você precisa de mais créditos para criar novos agendamentos. Adquira um plano."
          />

          <Alert
            type="info"
            message="Dica: Use filtros para encontrar agendamentos mais rapidamente."
            closable
            onClose={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
