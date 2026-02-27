"""Gemma 3 LLM adapter — uses HuggingFace Transformers for GPU inference."""

import os
from .llm_base import LLMBase
from observability import get_logger


logger = get_logger(__name__)


class GemmaAdapter(LLMBase):
    """Adapter for Google Gemma 3 12B model via Transformers."""

    MODEL_NAME = "google/gemma-3-12b-it"

    def __init__(self):
        self._model = None
        self._tokenizer = None

    def load(self, model_dir: str) -> None:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM

        model_path = os.path.join(model_dir, "gemma-3-12b-it")

        # Use local path if weights are pre-downloaded, else pull from HF
        if os.path.isdir(model_path):
            source = model_path
        else:
            source = self.MODEL_NAME
            logger.info("Downloading Gemma model", extra={"model": self.MODEL_NAME})

        logger.info("Loading Gemma model", extra={"source": source})
        self._tokenizer = AutoTokenizer.from_pretrained(source)
        self._model = AutoModelForCausalLM.from_pretrained(
            source,
            torch_dtype=torch.bfloat16,
            device_map="auto",
        )
        logger.info("Gemma model loaded")

    def generate(self, prompt: str, max_tokens: int = 4096) -> str:
        if self._model is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        import torch

        # Format as a chat message for the instruct model
        messages = [
            {"role": "user", "content": prompt},
        ]

        input_ids = self._tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            return_tensors="pt",
        ).to(self._model.device)

        input_len = input_ids.shape[-1]

        with torch.inference_mode():
            outputs = self._model.generate(
                input_ids,
                max_new_tokens=max_tokens,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
            )

        # Decode only the newly generated tokens
        generated_tokens = outputs[0][input_len:]
        text = self._tokenizer.decode(generated_tokens, skip_special_tokens=True)
        return text.strip()

    def unload(self) -> None:
        del self._model
        del self._tokenizer
        self._model = None
        self._tokenizer = None
        # Free GPU memory
        try:
            import torch
            torch.cuda.empty_cache()
        except Exception:
            pass
