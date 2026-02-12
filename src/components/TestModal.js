import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export default function TestModal() {
  const [modalSmVisible, setModalSmVisible] = useState(false);
  const [modalMdVisible, setModalMdVisible] = useState(false);
  const [modalLgVisible, setModalLgVisible] = useState(false);
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [modalNoCloseVisible, setModalNoCloseVisible] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          Teste de Modal
        </Text>
        <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
          Teste os 5 modais abaixo para validar tamanhos, animações e
          funcionalidades.
        </Text>

        {/* Botão 1: Modal SM */}
        <Button
          variant="primary"
          onPress={() => setModalSmVisible(true)}
        >
          Modal Small (90%)
        </Button>

        {/* Botão 2: Modal MD */}
        <Button
          variant="primary"
          onPress={() => setModalMdVisible(true)}
        >
          Modal Medium (80% - padrão)
        </Button>

        {/* Botão 3: Modal LG */}
        <Button
          variant="primary"
          onPress={() => setModalLgVisible(true)}
        >
          Modal Large (95%)
        </Button>

        {/* Botão 4: Modal com Formulário */}
        <Button
          variant="secondary"
          onPress={() => setModalFormVisible(true)}
        >
          Modal com Formulário
        </Button>

        {/* Botão 5: Modal sem fechar ao clicar fora */}
        <Button
          variant="secondary"
          onPress={() => setModalNoCloseVisible(true)}
        >
          Modal sem fechar fora (closeOnBackdrop=false)
        </Button>

        {/* Modal SM */}
        <Modal
          visible={modalSmVisible}
          onClose={() => setModalSmVisible(false)}
          size="sm"
          title="Modal Small"
          description="Este modal ocupa 90% da largura da tela."
        >
          <Text style={{ fontSize: 14, color: "#0f172a", lineHeight: 20 }}>
            Conteúdo do modal small. Ideal para alertas simples ou confirmações
            rápidas.
          </Text>
        </Modal>

        {/* Modal MD */}
        <Modal
          visible={modalMdVisible}
          onClose={() => setModalMdVisible(false)}
          size="md"
          title="Modal Medium (Padrão)"
          description="Este modal ocupa 80% da largura da tela (tamanho padrão)."
        >
          <Text style={{ fontSize: 14, color: "#0f172a", lineHeight: 20 }}>
            Conteúdo do modal medium. Tamanho padrão para a maioria dos casos de
            uso. Balanceamento ideal entre espaço e legibilidade.
          </Text>
        </Modal>

        {/* Modal LG */}
        <Modal
          visible={modalLgVisible}
          onClose={() => setModalLgVisible(false)}
          size="lg"
          title="Modal Large"
          description="Este modal ocupa 95% da largura da tela."
        >
          <Text
            style={{
              fontSize: 14,
              color: "#0f172a",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            Conteúdo do modal large. Ideal para formulários complexos ou
            conteúdo que precisa de mais espaço horizontal.
          </Text>
          <Text style={{ fontSize: 14, color: "#0f172a", lineHeight: 20 }}>
            Pode conter múltiplos parágrafos, listas, ou até mesmo componentes
            mais elaborados.
          </Text>
        </Modal>

        {/* Modal com Formulário */}
        <Modal
          visible={modalFormVisible}
          onClose={() => setModalFormVisible(false)}
          title="Novo Agendamento"
          description="Preencha os campos abaixo para criar um novo agendamento."
          footer={
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button
                variant="secondary"
                onPress={() => setModalFormVisible(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  alert("Salvando agendamento...");
                  setModalFormVisible(false);
                }}
              >
                Salvar
              </Button>
            </View>
          }
        >
          <View style={{ gap: 16 }}>
            <Input
              label="Nome do Cliente"
              placeholder="João Silva"
            />
            <Input
              label="Telefone"
              placeholder="+351 912 345 678"
              keyboardType="phone-pad"
            />
            <Input
              label="Serviço"
              placeholder="Corte + Barba"
            />
            <Input
              label="Observações"
              placeholder="Cliente preferencial"
              description="Opcional"
            />
          </View>
        </Modal>

        {/* Modal sem fechar ao clicar fora */}
        <Modal
          visible={modalNoCloseVisible}
          onClose={() => setModalNoCloseVisible(false)}
          closeOnBackdrop={false}
          title="Ação Importante"
          description="Este modal não fecha ao clicar fora. Use o botão ou X."
          footer={
            <Button
              variant="primary"
              onPress={() => setModalNoCloseVisible(false)}
            >
              Entendido
            </Button>
          }
        >
          <Text style={{ fontSize: 14, color: "#0f172a", lineHeight: 20 }}>
            Este modal tem `closeOnBackdrop=false`, então clicar fora não fecha
            o modal. Útil para ações críticas que exigem confirmação explícita.
          </Text>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
