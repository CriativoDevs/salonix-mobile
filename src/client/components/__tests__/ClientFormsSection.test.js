import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ClientFormsSection from "../ClientFormsSection";

jest.mock("../../../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      textPrimary: "#000",
      textSecondary: "#666",
      background: "#fff",
      surface: "#f8fafc",
      border: "#ccc",
      brandPrimary: "#3b82f6",
      error: "#ef4444",
    },
  }),
}));

jest.mock("../../../contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "pt" }),
}));

const mockFetch = jest.fn();
const mockUpdate = jest.fn();
jest.mock("../../../services/clientBooking", () => ({
  fetchClientFormResponses: (...a) => mockFetch(...a),
  updateClientFormResponse: (...a) => mockUpdate(...a),
}));

const editable = {
  id: "r1",
  form: "f1",
  form_title: "Anamnese",
  form_client_editable: true,
  updated_at: "2026-11-01T10:00:00Z",
  form_fields: [
    { id: "a", label: "Alergias", field_type: "text", required: true },
    { id: "b", label: "Gestante", field_type: "boolean", required: false },
  ],
  answers: [],
};

const readOnly = {
  id: "r2",
  form: "f2",
  form_title: "Histórico",
  form_client_editable: false,
  updated_at: null,
  form_fields: [
    { id: "c", label: "Medicação", field_type: "text", required: false },
    { id: "d", label: "Fumante", field_type: "boolean", required: false },
  ],
  answers: [
    { field_id: "c", value: "Nenhuma" },
    { field_id: "d", value: "true" },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ClientFormsSection", () => {
  it("não renderiza nada sem fichas", async () => {
    mockFetch.mockResolvedValue([]);
    const { queryByText } = await render(<ClientFormsSection />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(queryByText("Minhas fichas")).toBeNull();
  });

  it("mostra selos Editável/Por preencher e abre a ficha pendente", async () => {
    mockFetch.mockResolvedValue([editable, readOnly]);
    const { findByText, getByText, queryByText } = await render(<ClientFormsSection />);
    await findByText("Minhas fichas");
    expect(getByText("Editável")).toBeTruthy();
    expect(getByText("Por preencher")).toBeTruthy();
    expect(getByText("Só leitura")).toBeTruthy();
    // pendente abre sozinha; a só leitura fica recolhida
    expect(getByText("Salvar ficha")).toBeTruthy();
    expect(queryByText("Nenhuma")).toBeNull();
  });

  it("ficha só leitura mostra valores como texto, sem inputs nem salvar", async () => {
    mockFetch.mockResolvedValue([readOnly]);
    const { findByText, getByText, queryByText } = await render(<ClientFormsSection />);
    await findByText("Histórico");
    expect(getByText("Nenhuma")).toBeTruthy();
    expect(getByText("Sim")).toBeTruthy();
    expect(getByText("Esta ficha só pode ser alterada pelo estabelecimento.")).toBeTruthy();
    expect(queryByText("Salvar ficha")).toBeNull();
  });

  it("valida obrigatório antes de enviar", async () => {
    mockFetch.mockResolvedValue([editable]);
    const { findByText } = await render(<ClientFormsSection />);
    await fireEvent.press(await findByText("Salvar ficha"));
    expect(await findByText("Preencha o campo obrigatório: Alergias")).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("salva via PUT com todas as respostas e mostra confirmação", async () => {
    mockFetch.mockResolvedValue([editable]);
    mockUpdate.mockResolvedValue({
      ...editable,
      answers: [
        { field_id: "a", value: "Pólen" },
        { field_id: "b", value: "false" },
      ],
    });
    const { findByText, getByTestId, queryByText } = await render(<ClientFormsSection />);
    await findByText("Salvar ficha");
    await fireEvent.changeText(getByTestId("form-field-a"), "Pólen");
    await fireEvent.press(await findByText("Salvar ficha"));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("r1", {
        answers: [
          { field_id: "a", value: "Pólen" },
          { field_id: "b", value: "false" },
        ],
      })
    );
    expect(await findByText("Ficha salva.")).toBeTruthy();
    expect(queryByText("Por preencher")).toBeNull();
  });

  it("erro ao carregar mostra mensagem genérica, sem detalhes", async () => {
    mockFetch.mockRejectedValue({ response: { data: { detail: "dado sensível" } } });
    const { findByText, queryByText } = await render(<ClientFormsSection />);
    expect(await findByText("Não foi possível carregar as suas fichas.")).toBeTruthy();
    expect(queryByText("dado sensível")).toBeNull();
  });
});
