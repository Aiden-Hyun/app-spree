"""Llama 3.1 8B LLM adapter — uses vLLM for fast GPU inference."""

import os
from .llm_base import LLMBase
from observability import get_logger


logger = get_logger(__name__)


class LlamaAdapter(LLMBase):
    """Adapter for Meta Llama 3.1 8B Instruct model via vLLM."""

    MODEL_NAME = "meta-llama/Llama-3.1-8B-Instruct"

    def __init__(self):
        self._llm = None

    def load(self, model_dir: str) -> None:
        from vllm import LLM

        model_path = os.path.join(model_dir, "Llama-3.1-8B-Instruct")

        if os.path.isdir(model_path):
            source = model_path
        else:
            source = self.MODEL_NAME
            logger.info("Downloading Llama model", extra={"model": self.MODEL_NAME})

        self._llm = LLM(
            model=source,
            dtype="bfloat16",
            max_model_len=8192,
            gpu_memory_utilization=0.85,
        )
        logger.info("Llama model loaded", extra={"source": source})

    def generate(self, prompt: str, max_tokens: int = 4096) -> str:
        if self._llm is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        from vllm import SamplingParams

        params = SamplingParams(
            temperature=0.7,
            top_p=0.9,
            max_tokens=max_tokens,
            stop=["<end_of_script>", "---END---"],
        )

        outputs = self._llm.generate([prompt], params)
        return outputs[0].outputs[0].text.strip()

    def unload(self) -> None:
        del self._llm
        self._llm = None
        try:
            import torch
            torch.cuda.empty_cache()
        except Exception:
            pass
