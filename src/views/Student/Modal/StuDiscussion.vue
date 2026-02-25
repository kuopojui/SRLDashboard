<template>
  <div class="StuDiscussion container py-4 animate__animated animate__fadeIn">
    <div class="discussion-list mx-auto" style="max-width: 800px">
      <div
        v-for="d in sortedDiscussions"
        :key="d.id"
        class="discussion-item p-4 mb-3 bg-white rounded-4 shadow-sm"
        @click="openDiscussion(d.id)"
      >
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="mb-1">
              <span class="badge-pill bg-navy-soft text-navy fw-bold me-2">{{
                getAuthorDisplay(d.uid)
              }}</span>
            </div>
            <h5 class="fw-bold text-dark">{{ d.title }}</h5>
            <p class="text-muted small mb-0">{{ d.description }}</p>
          </div>
          <i class="bi bi-chevron-right text-muted opacity-50"></i>
        </div>
      </div>
    </div>

    <div class="text-center mt-5">
      <button
        class="btn btn-navy-pill px-5 py-3 shadow-lg fw-bold"
        @click="showCreateModal = true"
      >
        <i class="bi bi-plus-lg me-2"></i>發起新話題
      </button>
    </div>
  </div>
</template>

<script setup>
import "./StuTask.css";
// ...其餘邏輯維持討論區的功能
</script>
