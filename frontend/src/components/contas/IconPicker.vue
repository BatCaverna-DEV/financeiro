<template>
  <div class="icon-picker">
    <!-- Preview do ícone selecionado -->
    <div class="d-flex align-items-center gap-3 mb-3">
      <div class="icon-preview">
        <i class="bi" :class="modelValue || 'bi-wallet2'"></i>
      </div>
      <div>
        <p class="mb-0 small fw-medium">Ícone selecionado</p>
        <code class="text-muted" style="font-size:.75rem">{{ modelValue || 'bi-wallet2' }}</code>
      </div>
    </div>

    <!-- Pesquisa -->
    <div class="input-group input-group-sm mb-2">
      <span class="input-group-text bg-light border-end-0">
        <i class="bi bi-search text-muted"></i>
      </span>
      <input
        v-model="search"
        type="text"
        class="form-control border-start-0 ps-0"
        placeholder="Pesquisar ícone..."
      />
      <button v-if="search" type="button" class="input-group-text bg-light" @click="search = ''">
        <i class="bi bi-x text-muted"></i>
      </button>
    </div>

    <!-- Grid de ícones -->
    <div class="icon-grid">
      <button
        v-for="icon in filtered"
        :key="icon"
        type="button"
        class="icon-btn"
        :class="{ 'icon-btn--active': modelValue === `bi-${icon}` }"
        :title="icon"
        @click="$emit('update:modelValue', `bi-${icon}`)"
      >
        <i class="bi" :class="`bi-${icon}`"></i>
        <span>{{ icon }}</span>
      </button>
    </div>

    <p v-if="filtered.length === 0" class="text-center text-muted small py-3">
      Nenhum ícone encontrado para "<strong>{{ search }}</strong>"
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({ modelValue: String })
defineEmits(['update:modelValue'])

const search = ref('')

const ICONS = [
  // Bancário e financeiro
  'bank', 'bank2', 'piggy-bank', 'piggy-bank-fill',
  'cash', 'cash-stack', 'cash-coin', 'coin',
  'currency-dollar', 'currency-euro', 'currency-bitcoin', 'currency-exchange',
  'safe', 'safe2', 'safe-fill',
  // Carteiras e cartões
  'wallet', 'wallet2', 'wallet-fill',
  'credit-card', 'credit-card-fill', 'credit-card-2-front',
  // Negócios e trabalho
  'briefcase', 'briefcase-fill',
  'building', 'building-fill',
  'shop', 'shop-window',
  'bag', 'bag-fill',
  // Investimentos
  'graph-up', 'graph-up-arrow', 'graph-down',
  'gem', 'trophy', 'award',
  // Vida e pessoal
  'house', 'house-fill',
  'house-door', 'house-door-fill',
  'car-front', 'car-front-fill',
  'airplane',
  'heart', 'heart-fill',
  'star', 'star-fill',
  // Tecnologia e outros
  'phone', 'laptop', 'tools', 'gear',
  'box', 'archive', 'gift',
]

const filtered = computed(() =>
  search.value
    ? ICONS.filter(i => i.includes(search.value.toLowerCase()))
    : ICONS
)
</script>

<style scoped>
.icon-preview {
  width: 52px;
  height: 52px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: #6366f1;
  flex-shrink: 0;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 2px;
}

.icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px 6px;
  border: 1.5px solid #e9ecef;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0;
  color: #495057;
}
.icon-btn i {
  font-size: 1.25rem;
}
.icon-btn span {
  font-size: 0.6rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.icon-btn:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.06);
  color: #6366f1;
}
.icon-btn:hover span { color: #6366f1; }

.icon-btn--active {
  border-color: #6366f1 !important;
  background: rgba(99, 102, 241, 0.12) !important;
  color: #6366f1 !important;
}
.icon-btn--active span { color: #6366f1; }
</style>
