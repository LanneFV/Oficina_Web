import os
import sys
import json
import vosk


class VoskProcessor:
    def __init__(
        self,
        model_path,
        sample_rate=16000,
        words_per_chunk=10,
        stability_threshold=2,
    ):
        """
        :param model_path: Caminho para a pasta do modelo pt-BR
        :param sample_rate: Taxa de amostragem (padrão 16000Hz)
        :param words_per_chunk: Quantas palavras estáveis acumular antes de
                                liberar um chunk pro VLibras.
        :param stability_threshold: Quantas leituras seguidas uma palavra
                                    precisa aparecer no mesmo índice pra
                                    ser considerada estável.
        """
        if not os.path.exists(model_path):
            print(f"ERRO: Modelo não encontrado em '{model_path}'")
            print("Baixe em: https://alphacephei.com/vosk/models")
            sys.exit(1)

        vosk.SetLogLevel(-1)

        self.model = vosk.Model(model_path)
        self.rec = vosk.KaldiRecognizer(self.model, sample_rate)
        self.rec.SetWords(True)

        self.words_per_chunk = words_per_chunk
        self.stability_threshold = stability_threshold

        # Estado da frase atual (resetado a cada Result final)
        self._sent_count = 0           # quantas palavras já liberei pro VLibras
        self._last_partial_words = []  # último partial visto (lista de palavras)
        self._stable_hits = 0          # quantas vezes vi o mesmo partial seguido

    def _reset_utterance(self):
        self._sent_count = 0
        self._last_partial_words = []
        self._stable_hits = 0

    def process_chunk(self, byte_data):
        """
        Recebe um chunk de áudio bruto.

        Retorna uma tupla (chunk_para_vlibras, texto_completo, eh_final):
          - chunk_para_vlibras: str ou None. Quando não-None, é um pedaço
            novo e estável que deve ser enviado ao widget VLibras.
          - texto_completo: o texto atual reconhecido (partial ou final),
            útil pra legenda na extensão.
          - eh_final: True se o Vosk fechou um enunciado.
        """
        if self.rec.AcceptWaveform(byte_data):
            result = json.loads(self.rec.Result())
            full_text = result.get("text", "")
            words = full_text.split()

            # Manda o que ainda não foi enviado deste enunciado
            remaining = words[self._sent_count:]
            chunk = " ".join(remaining) if remaining else None

            self._reset_utterance()
            return chunk, full_text, True

        else:
            partial = json.loads(self.rec.PartialResult())
            full_text = partial.get("partial", "")
            words = full_text.split()

            # Atualiza contador de estabilidade
            if words == self._last_partial_words:
                self._stable_hits += 1
            else:
                self._stable_hits = 1
                self._last_partial_words = words

            chunk = None
            unsent = len(words) - self._sent_count

            # Libera um chunk se: temos palavras suficientes E o partial
            # apareceu igual por N leituras (sinal de que estabilizou)
            if (
                unsent >= self.words_per_chunk
                and self._stable_hits >= self.stability_threshold
            ):
                end = self._sent_count + self.words_per_chunk
                chunk_words = words[self._sent_count:end]
                chunk = " ".join(chunk_words)
                self._sent_count = end

            return chunk, full_text, False

    def get_final(self):
        """
        Retorna o que sobrou ao fechar o stream.
        Use isso quando a extensão desconectar pra não perder o último pedaço.
        """
        result = json.loads(self.rec.FinalResult())
        full_text = result.get("text", "")
        words = full_text.split()
        remaining = words[self._sent_count:]
        chunk = " ".join(remaining) if remaining else None
        self._reset_utterance()
        return chunk, full_text