<template>
  <div class="StuUnit-Page" :class="{ 'has-monitor': showMonitor }">
    <header class="sticky-top shadow-sm srl-header">
      <nav class="srl-monitor-navbar">
        <div
          v-if="activeFeatures.monitoring && srlSession"
          class="header-progress-container"
        >
          <div
            class="header-progress-fill"
            :style="{ width: actualProgressPercent + '%' }"
            :class="{ 'over-time': isOverTime }"
          ></div>
        </div>

        <div class="container-fluid h-100 px-2 px-md-4">
          <div class="row align-items-center h-100 g-0">
            <div
              class="col-3 col-md-4 d-flex align-items-center overflow-hidden"
            >
              <button
                @click="goBack"
                class="btn-back flex-shrink-0 me-2"
                title="返回"
              >
                <i class="bi bi-arrow-left"></i>
              </button>
              <div
                class="unit-meta d-flex flex-column justify-content-center overflow-hidden"
              >
                <h5
                  class="mb-0 fw-bold text-white unit-title-text text-truncate"
                >
                  {{ unitTitle }}
                </h5>
                <small
                  class="text-white text-opacity-50 d-none d-lg-block"
                  style="font-size: 0.6rem"
                >
                  {{ activeTabName }}
                </small>
              </div>
            </div>

            <div
              class="col-6 col-md-4 d-flex flex-column align-items-center justify-content-center px-1"
            >
              <div class="timer-badge-wrapper mb-1">
                <code class="timer-badge-main">
                  {{ formattedTime }}
                  <span class="d-none d-md-inline">
                    <span class="mx-1 opacity-25">/</span
                    >{{ srlSession?.targetTime }}:00
                  </span>
                </code>
              </div>

              <div class="progress-center-track shadow-inner">
                <div
                  class="progress-center-fill"
                  :style="{ width: actualProgressPercent + '%' }"
                  :class="{ 'is-over-time': isOverTime }"
                ></div>

                <Transition name="bounce">
                  <div v-if="isOverTime" class="overtime-alert-bubble">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span class="d-none d-sm-inline ms-1 text-nowrap"
                      >已超時</span
                    >
                  </div>
                </Transition>
              </div>
            </div>

            <div
              class="col-3 col-md-4 d-flex justify-content-end align-items-center gap-2"
            >
              <button
                v-if="activeFeatures.monitoring"
                @click="showMonitor = !showMonitor"
                class="btn-ai-mini"
                :class="{ 'is-active': showMonitor }"
              >
                <i class="bi bi-cpu-fill"></i>
                <span class="ms-2 d-none d-lg-inline">監控儀表板</span>
              </button>

              <button @click="handleFinish" class="btn-finish-sm">
                <i class="bi bi-check2-all"></i>
                <span class="ms-2 d-none d-lg-inline text-nowrap"
                  >完成學習</span
                >
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <div
      v-if="showMonitor"
      class="monitor-overlay d-lg-none"
      @click="showMonitor = false"
    ></div>

    <Transition name="slide-drawer">
      <div v-if="showMonitor" class="monitor-drawer shadow-lg">
        <div
          v-if="isMonitorLoading"
          class="p-5 text-center h-100 d-flex flex-column justify-content-center"
        >
          <div class="spinner-border text-navy mb-3" role="status"></div>
          <p class="text-muted small italic">正在同步學習軌跡...</p>
        </div>

        <div v-else class="monitor-content-wrapper">
          <div
            class="drawer-header p-4 border-bottom d-flex justify-content-between align-items-center"
          >
            <div>
              <h5 class="fw-900 text-navy mb-1">
                <i class="bi bi-cpu-fill me-2 text-primary"></i>自我調節監控中心
              </h5>
              <span class="badge-update-time"
                >數據更新：{{ lastUpdateTime }}</span
              >
            </div>
            <button @click="showMonitor = false" class="btn-close-minimal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="drawer-body p-4 custom-scrollbar">
            <div class="monitor-section mb-4">
              <label class="section-label-v2"
                >班級領先群 (Top 25%) 對照圖</label
              >
              <div
                class="comparison-card p-4 rounded-4 bg-white border-dashed-soft shadow-xs"
              >
                <div
                  class="d-flex justify-content-around align-items-end"
                  style="height: 140px"
                >
                  <div class="v-bar-container">
                    <div
                      class="v-bar my-score"
                      :style="{ height: (currentScore / 100) * 100 + '%' }"
                    >
                      <span class="bar-val">{{ currentScore }}</span>
                    </div>
                    <span class="bar-label">個人得分</span>
                  </div>
                  <div class="v-bar-container">
                    <div
                      class="v-bar top-score"
                      :style="{ height: (topAverage / 100) * 100 + '%' }"
                    >
                      <span class="bar-val">{{ topAverage }}</span>
                    </div>
                    <span class="bar-label">領先平均</span>
                  </div>
                </div>

                <div
                  class="gap-indicator-v2 mt-4"
                  :class="scoreGap >= 0 ? 'is-positive' : 'is-negative'"
                >
                  <i
                    class="bi"
                    :class="
                      scoreGap >= 0 ? 'bi-graph-up' : 'bi-patch-exclamation'
                    "
                  ></i>
                  <span>{{
                    scoreGap >= 0
                      ? "表現優異，請維持進度"
                      : `距離領先目標尚差 ${Math.abs(scoreGap)} 分`
                  }}</span>
                </div>
              </div>
            </div>

            <div class="monitor-section mb-4">
              <label class="section-label-v2">改善建議</label>
              <div
                class="ai-chat-box p-3 rounded-4 shadow-sm border-start border-4 border-primary"
              >
                <div
                  class="d-flex align-items-center justify-content-between mb-3 text-navy"
                >
                  <div class="d-flex align-items-center">
                    <div class="ai-avatar me-2">
                      <i class="bi bi-stars"></i>
                    </div>
                    <span class="fw-bold small">智慧調節分析：</span>
                  </div>
                  <span
                    v-if="isAiThinking"
                    class="badge bg-primary-subtle text-primary border-0 small px-2 py-1"
                  >
                    <span
                      class="spinner-border spinner-border-sm me-1"
                      role="status"
                    ></span>
                    正在對標全班數據...
                  </span>
                </div>

                <div class="strategy-list-v2">
                  <div v-if="isAiThinking" class="py-3">
                    <div class="placeholder-glow">
                      <span
                        class="placeholder col-12 rounded-pill bg-light mb-2"
                      ></span>
                      <span
                        class="placeholder col-8 rounded-pill bg-light"
                      ></span>
                    </div>
                  </div>

                  <div class="strategy-list-v2">
                    <Transition name="fade" mode="out-in">
                      <div v-if="aiStrategies.length > 0" key="advice-list">
                        <TransitionGroup name="fade-slide" tag="div">
                          <div
                            v-for="(strategy, index) in aiStrategies"
                            :key="strategy"
                            class="ai-reply-content"
                          >
                            <div
                              class="ai-reply-pill p-3 mb-2 rounded-3 bg-white shadow-xs border"
                            >
                              <div class="d-flex align-items-start">
                                <i
                                  class="bi bi-chat-left-text-fill text-primary me-2 mt-1"
                                ></i>
                                <div class="small text-dark lh-base">
                                  {{ strategy }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TransitionGroup>
                      </div>

                      <div
                        v-else
                        key="empty-state"
                        class="ai-reply-pill opacity-75 italic text-center py-4 bg-light rounded-3"
                      >
                        <i class="bi bi-shield-check me-2 text-success"></i>
                        目前您的學習步調與領先群同步，請繼續保持。
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </div>

            <div class="monitor-section mb-4">
              <label class="section-label-v2">單元操作數據</label>
              <div
                class="trace-stats-v2 p-3 bg-white border rounded-4 shadow-sm"
              >
                <div
                  class="trace-row d-flex justify-content-between py-2 border-bottom"
                >
                  <span class="text-muted small">
                    <i class="bi bi-play-circle me-2"></i>影片觀看
                  </span>
                  <strong class="text-navy">
                    {{ Math.floor(traceData.videoMins || 0) }} min
                  </strong>
                </div>

                <div
                  class="trace-row d-flex justify-content-between py-2 border-bottom"
                >
                  <span class="text-muted small">
                    <i class="bi bi-book me-2"></i>教材閱讀
                  </span>
                  <strong class="text-navy">
                    {{ Math.floor(traceData.readingMins || 0) }} min
                  </strong>
                </div>
                <div class="trace-row d-flex justify-content-between py-2">
                  <span class="text-muted small"
                    ><i class="bi bi-x-circle me-2"></i>累積錯誤</span
                  >
                  <strong
                    :class="
                      traceData.errorCount > 3 ? 'text-danger' : 'text-success'
                    "
                  >
                    {{ traceData.errorCount }} 題
                  </strong>
                </div>
              </div>
            </div>

            <button
              @click="showMonitor = false"
              class="btn btn-navy w-100 rounded-pill py-3 shadow-sm mt-2"
            >
              確認並繼續學習
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <main class="container-fluid py-4 main-content">
      <div class="row g-4 justify-content-center">
        <div class="col-lg-2 unit-sidebar-rwd">
          <div class="sidebar-sticky-wrapper">
            <div
              class="sidebar-tabs-container border shadow-sm rounded-4 overflow-hidden bg-white"
            >
              <p
                class="text-uppercase small fw-bold text-muted mb-lg-3 d-none d-lg-block px-3 pt-3"
              >
                單元任務
              </p>
              <ul class="nav flex-lg-column flex-row custom-nav-scroll">
                <li v-for="tab in tabs" :key="tab.id" class="nav-item">
                  <a
                    class="nav-link-sidebar"
                    :class="{ active: activeTab === tab.id }"
                    @click="activeTab = tab.id"
                  >
                    <i :class="tab.icon"></i>
                    <span class="tab-label ms-2">{{ tab.label }}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          :class="[
            activeFeatures.monitoring ? 'col-lg-7' : 'col-lg-9',
            'col-md-8',
          ]"
        >
          <div
            class="card content-card border-0 shadow-sm min-vh-70 rounded-4 overflow-hidden bg-white"
          >
            <div class="card-body p-4">
              <div class="tab-content-wrapper">
                <div v-if="activeTab === 'material'" class="material-view">
                  <div v-if="isContentLoading" class="py-5 text-center">
                    <div class="spinner-border text-primary mb-2"></div>
                    <p class="text-muted">正在準備單元教材...</p>
                  </div>

                  <div v-else-if="unitContent" class="material-active-area">
                    <div
                      v-if="unitContent.fileUrl?.includes('.mp4')"
                      class="video-section mb-4"
                    >
                      <div
                        class="video-container shadow-sm rounded-4 overflow-hidden bg-black"
                      >
                        <video
                          ref="videoPlayerRef"
                          controls
                          controlsList="nodownload"
                          class="w-100"
                          style="max-height: 55vh"
                          :src="unitContent.fileUrl"
                          @timeupdate="handleVideoProgress"
                        ></video>
                      </div>
                      <div
                        class="p-3 border border-top-0 rounded-bottom-4 d-flex justify-content-between align-items-center"
                      >
                        <h6 class="fw-bold mb-0 text-navy">
                          {{ unitContent.title }}
                        </h6>
                        <span
                          class="badge bg-primary-subtle text-primary border border-primary-subtle"
                        >
                          已觀看：{{ traceData.videoMins.toFixed(1) }} min
                        </span>
                      </div>
                    </div>

                    <div v-if="unitContent" class="material-active-area">
                      <div
                        v-if="unitContent.fileUrl?.includes('.mp4')"
                        class="video-section mb-4"
                      >
                        <div
                          class="video-container shadow-sm rounded-4 overflow-hidden bg-black"
                        >
                          <video
                            ref="videoPlayerRef"
                            controls
                            controlsList="nodownload"
                            class="w-100"
                            style="max-height: 55vh"
                            :src="unitContent.fileUrl"
                            @timeupdate="handleVideoProgress"
                          ></video>
                        </div>
                      </div>

                      <div
                        v-else-if="
                          unitContent.fileUrl?.toLowerCase().includes('.pdf')
                        "
                        class="document-section mb-4"
                      >
                        <div
                          class="card border shadow-sm rounded-4 overflow-hidden"
                        >
                          <div
                            class="card-header bg-navy text-white p-3 d-flex justify-content-between align-items-center"
                          >
                            <span class="fw-bold small"
                              ><i class="bi bi-file-earmark-pdf me-2"></i
                              >{{ unitContent.title }}</span
                            >
                            <span
                              class="badge bg-info-subtle text-info border border-info-subtle"
                            >
                              閱讀計時：{{ traceData.readingMins.toFixed(1) }}
                              min
                            </span>
                          </div>
                          <div
                            class="card-body p-0 bg-light"
                            style="height: 55vh"
                          >
                            <iframe
                              :src="unitContent.fileUrl"
                              width="100%"
                              height="100%"
                              frameborder="0"
                            ></iframe>
                          </div>
                        </div>
                      </div>

                      <div v-else class="download-section mb-4">
                        <div
                          class="card border-dashed p-5 text-center bg-white rounded-4 shadow-sm"
                        >
                          <div class="download-icon-wrapper mb-3">
                            <i
                              class="bi bi-file-earmark-arrow-down display-2 text-navy opacity-50"
                            ></i>
                          </div>
                          <h5 class="fw-bold text-navy">
                            {{ unitContent.title }}
                          </h5>
                          <p class="text-muted small mb-4">
                            此文件格式無法在線上直接預覽。<br />
                            請下載文件後進行學習，並記得隨時回到此頁面記錄您的心得。
                          </p>

                          <div class="d-flex justify-content-center gap-3">
                            <a
                              :href="unitContent.fileUrl"
                              target="_blank"
                              download
                              class="btn-navy-pill text-decoration-none"
                            >
                              <i class="bi bi-cloud-download me-2"></i
                              >立即下載文件
                            </a>
                          </div>

                          <div class="mt-4 p-3 bg-light rounded-3">
                            <small class="text-muted italic">
                              <i class="bi bi-info-circle me-1"></i>
                              下載後學習期間，系統仍會為您統計「閱讀計時」數據。
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="material-list-section">
                      <label class="section-label-v2 mb-2">單元教材清單</label>
                      <div class="list-group rounded-3 border-0 shadow-sm">
                        <button
                          v-for="(mat, mIdx) in unitMaterials"
                          :key="mIdx"
                          class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-light"
                          :class="{
                            'active bg-navy-light text-navy fw-bold':
                              unitContent.fileUrl === mat.fileUrl,
                          }"
                          @click="switchMaterial(mat)"
                        >
                          <div class="d-flex align-items-center small">
                            <i
                              :class="
                                mat.fileUrl?.includes('.mp4')
                                  ? 'bi bi-play-circle-fill me-3'
                                  : 'bi bi-file-earmark-text me-3'
                              "
                            ></i>
                            <span>{{ mat.title }}</span>
                          </div>
                          <i
                            v-if="unitContent.fileUrl === mat.fileUrl"
                            class="bi bi-check-circle-fill text-oatmeal-light"
                          ></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="tab-content-wrapper">
                  <div
                    v-if="activeTab === 'material'"
                    class="material-view"
                  ></div>

                  <div v-else-if="activeTab === 'quiz'" class="quiz-view">
                    <h5 class="fw-bold text-navy mb-4">
                      <i class="bi bi-card-checklist me-2"></i>單元測驗任務
                    </h5>
                    <div
                      v-if="unitExams.length"
                      class="list-group list-group-flush gap-3"
                    >
                      <div
                        v-for="ex in unitExams"
                        :key="ex.id"
                        class="card border rounded-4 p-3 shadow-sm hover-lift bg-white"
                      >
                        <div
                          class="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <h6 class="fw-bold mb-1">{{ ex.title }}</h6>
                            <small class="text-muted"
                              >時長：{{ ex.duration }} 分鐘 | 總分：{{
                                ex.totalScore
                              }}</small
                            >
                          </div>
                          <button
                            @click="startExam(ex.id)"
                            class="btn btn-primary btn-sm rounded-pill px-4 shadow-sm"
                          >
                            進入測驗
                          </button>
                        </div>
                      </div>
                    </div>
                    <div
                      v-else
                      class="text-center py-5 bg-light rounded-4 border-dashed"
                    >
                      <p class="text-muted mb-0 italic small">
                        本單元目前尚無關聯測驗
                      </p>
                    </div>
                  </div>

                  <div v-else-if="activeTab === 'hw'" class="hw-view">
                    <h5 class="fw-bold text-navy mb-4">
                      <i class="bi bi-file-earmark-arrow-up me-2"></i
                      >功課提交列表
                    </h5>
                    <div
                      v-if="unitAssignments.length"
                      class="list-group list-group-flush gap-3"
                    >
                      <div
                        v-for="hw in unitAssignments"
                        :key="hw.id"
                        class="card border rounded-4 p-3 shadow-sm bg-white"
                      >
                        <div
                          class="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <h6 class="fw-bold mb-1">{{ hw.title }}</h6>
                            <small class="text-muted"
                              >截止日期：{{ hw.deadline || "未設定" }}</small
                            >
                          </div>
                          <button
                            @click="startHw(hw.id)"
                            class="btn btn-navy btn-sm rounded-pill px-4 shadow-sm"
                          >
                            提交功課
                          </button>
                        </div>
                      </div>
                    </div>
                    <div
                      v-else
                      class="text-center py-5 bg-light rounded-4 border-dashed"
                    >
                      <p class="text-muted mb-0 italic small">
                        本單元目前尚無功課任務
                      </p>
                    </div>
                  </div>

                  <div v-else-if="activeTab === 'discuss'" class="discuss-view">
                    <div
                      class="d-flex justify-content-between align-items-center mb-4"
                    >
                      <h5 class="fw-bold text-navy mb-0">
                        <i class="bi bi-chat-dots me-2"></i>單元討論區
                      </h5>
                      <button
                        @click="openCreateDiscussion"
                        class="btn btn-outline-navy btn-sm rounded-pill px-3 shadow-sm"
                      >
                        + 發起話題
                      </button>
                    </div>
                    <div v-if="unitForums.length" class="list-group gap-3">
                      <div
                        v-for="dis in unitForums"
                        :key="dis.id"
                        class="card border shadow-sm p-3 rounded-4 bg-white"
                      >
                        <div
                          class="d-flex justify-content-between align-items-center"
                        >
                          <div class="text-truncate" style="max-width: 70%">
                            <h6 class="fw-bold mb-1">{{ dis.title }}</h6>
                            <small class="text-muted">{{
                              dis.description
                            }}</small>
                          </div>
                          <button
                            @click="enterDiscussion(dis.id)"
                            class="btn btn-light btn-sm rounded-pill px-3 border"
                          >
                            參與討論
                          </button>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-center py-5">
                      <img
                        src="https://img.icons8.com/bubbles/80/null/chat.png"
                        class="mb-2 opacity-75"
                      />
                      <p class="text-muted small italic">
                        成為第一個在本單元發起討論的人吧！
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="activeFeatures.monitoring && srlSession"
          class="col-lg-3 col-md-4"
        >
          <div class="sticky-top sidebar-sticky-wrapper">
            <div
              class="card toolbox-card border-0 shadow-sm mb-4 rounded-4 bg-white"
            >
              <div class="card-body">
                <h6 class="fw-bold text-navy mb-3">
                  <i class="bi bi-lightbulb-fill text-warning me-2"></i>規劃策略
                </h6>
                <div class="d-flex flex-wrap gap-2">
                  <span
                    v-for="s in srlSession.strategies"
                    :key="s"
                    class="badge-strategy-sidebar small"
                    >{{ s }}</span
                  >
                </div>
              </div>
            </div>
            <div class="card note-card border-0 shadow-sm rounded-4 bg-white">
              <div class="card-body">
                <h6 class="fw-bold text-navy mb-3">
                  <i class="bi bi-pencil-square me-2 text-primary"></i>學習筆記
                </h6>
                <textarea
                  class="form-control mb-3 border-light bg-light small"
                  rows="8"
                  placeholder="輸入您的思考..."
                ></textarea>
                <button
                  class="btn btn-navy btn-sm w-100 rounded-pill shadow-sm py-2"
                >
                  儲存筆記紀錄
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showExamModal"
          class="modal-overlay-srl"
          @click.self="handleModalClose('exam')"
        >
          <div class="srl-modal-container shadow-2xl">
            <StuExamModal
              :isOpen="showExamModal"
              :courseId="courseId"
              :unitId="id"
              :examId="activeTaskId"
              @close="handleModalClose('exam')"
            />
          </div>
        </div>
      </Transition>

      <Transition name="modal-fade">
        <div
          v-if="showHwModal"
          class="modal-overlay-srl"
          @click.self="handleModalClose('hw')"
        >
          <div class="srl-modal-container shadow-2xl">
            <StuHwModal
              :isOpen="showHwModal"
              :courseId="courseId"
              :unitId="id"
              :taskId="activeTaskId"
              @close="handleModalClose('hw')"
            />
          </div>
        </div>
      </Transition>

      <Transition name="modal-fade">
        <div
          v-if="showDiscussModal"
          class="modal-overlay-srl"
          @click.self="handleModalClose('discuss')"
        >
          <div class="srl-modal-container shadow-2xl">
            <StuDiscussModal
              :isOpen="showDiscussModal"
              :courseId="courseId"
              :unitId="id"
              :disId="activeTaskId"
              @close="handleModalClose('discuss')"
            />
          </div>
        </div>
      </Transition>

      <Transition name="modal-fade">
        <div
          v-if="showEvalModal"
          class="modal-overlay-srl"
          @click.self="showEvalModal = false"
        >
          <div class="srl-modal-container shadow-2xl reflection-content-layer">
            <StuSRLEval
              :isOpen="showEvalModal"
              :plannedMins="srlSession?.targetTime || 0"
              :actualMins="Math.floor(elapsedTime / 60)"
              @close="showEvalModal = false"
              @confirm="onEvalConfirm"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { rtdb } from "../../firebase/config";
import {
  ref as dbRef,
  get,
  onValue,
  update,
  serverTimestamp,
} from "firebase/database";
import "./StuUnit.css";
import StuSRLEval from "./Modal/StuSRLEval.vue";
import StuExamModal from "./Modal/StuExam.vue";
import StuHwModal from "./Modal/StuHW.vue";
import StuDiscussModal from "./Modal/StuDiscussion.vue";
import { AiService } from "../../services/aiService.js";

const props = defineProps({ courseId: String, id: String, userId: String });
const router = useRouter();

// --- 1. UI 狀態控制 ---
const showMonitor = ref(false);
const showEvalModal = ref(false);
const activeTab = ref("material");
const unitTitle = ref("正在載入...");
const isMonitorLoading = ref(false);
const isContentLoading = ref(false);
const lastUpdateTime = ref("");

// 記錄上次 AI 檢查的分鐘數，防止同一分鐘內重複觸發
const tabs = [
  { id: "material", label: "課程教材", icon: "bi bi-book" },
  { id: "quiz", label: "單元檢測", icon: "bi bi-card-checklist" },
  { id: "hw", label: "功課提交", icon: "bi bi-file-earmark-arrow-up" },
  { id: "discuss", label: "討論區", icon: "bi bi-chat-dots" },
];

const isAiThinking = ref(false);

// --- 2. 實驗組功能開關 ---
const activeFeatures = reactive({
  planning: false,
  monitoring: false,
  aiAdvice: false,
  reflection: false,
  isLeaderboardAnonymous: false,
});

// --- 3. 教材專區與計時變數 ---
const videoPlayerRef = ref(null);
const unitMaterials = ref([]);
const unitContent = ref(null);
const lastTrackTime = ref(0);
let readingTimer = null;

// --- 4. SRL 會話與監控數據 ---
const srlSession = ref(null);
const elapsedTime = ref(0);
let timerInterval = null;

const currentScore = ref(0);
const topAverage = ref(0);
const aiStrategies = ref([]);
const traceData = ref({
  videoMins: 0,
  readingMins: 0,
  errorCount: 0,
  totalSeconds: 0,
});

// --- 5. 計算屬性 ---
const formattedTime = computed(() => {
  const m = Math.floor(elapsedTime.value / 60);
  const s = elapsedTime.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});
const actualProgressPercent = computed(() => {
  const planned = (srlSession.value?.targetTime || 1) * 60;
  return Math.min((elapsedTime.value / planned) * 100, 100);
});
const isOverTime = computed(() => {
  const plannedSecs = (srlSession.value?.targetTime || 0) * 60;
  return plannedSecs > 0 && elapsedTime.value > plannedSecs;
});
const activeTabName = computed(
  () => tabs.find((t) => t.id === activeTab.value)?.label || "",
);
const scoreGap = computed(
  () => (topAverage.value || 0) - (currentScore.value || 0),
);

// --- 6. 事件處理與計時邏輯 ---

const switchMaterial = (mat) => {
  unitContent.value = mat;
  lastTrackTime.value = 0;
  manageReadingTimer();
};

// 影片播放進度追蹤
const handleVideoProgress = () => {
  if (!videoPlayerRef.value) return;
  const current = videoPlayerRef.value.currentTime;
  const delta = current - lastTrackTime.value;
  if (delta > 0 && delta < 2) {
    const addedMins = delta / 60;
    traceData.value.videoMins += addedMins;
    if (Math.floor(current) % 15 === 0) {
      // 每 15 秒同步一次影片進度
      update(dbRef(rtdb, `student_traces/${props.userId}_${props.id}`), {
        videoMins: traceData.value.videoMins,
        lastActive: serverTimestamp(),
      });
    }
  }
  lastTrackTime.value = current;
};

// 閱讀計時邏輯 (PDF / 下載件)
const manageReadingTimer = () => {
  if (readingTimer) clearInterval(readingTimer);

  // 條件：在教材分頁、有內容、且不是影片
  if (
    activeTab.value === "material" &&
    unitContent.value &&
    !unitContent.value.fileUrl?.includes(".mp4")
  ) {
    console.log("📖 閱讀計時器已啟動...");
    readingTimer = setInterval(() => {
      // 🌟 核心：確保 traceData.value 屬性被正確修改
      if (!traceData.value.readingMins) traceData.value.readingMins = 0;
      traceData.value.readingMins += 1 / 60;

      // 每 15 秒同步一次 Firebase，減少請求但保持數據安全
      const currentSecs = Math.floor(traceData.value.readingMins * 60);
      if (currentSecs > 0 && currentSecs % 15 === 0) {
        update(dbRef(rtdb, `student_traces/${props.userId}_${props.id}`), {
          readingMins: traceData.value.readingMins,
          lastActive: serverTimestamp(),
        });
      }
    }, 1000);
  }
};

// 總投入時間計時器 (帶自動存檔)
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedTime.value++;
    // 每 10 秒將總秒數備份到 Firebase，防止重整
    if (elapsedTime.value % 10 === 0) {
      update(dbRef(rtdb, `student_traces/${props.userId}_${props.id}`), {
        totalSeconds: elapsedTime.value,
        lastActive: serverTimestamp(),
      });
    }
  }, 1000);
};

// --- 7. 核心初始化 ---
const unitExams = ref([]);
const unitAssignments = ref([]);
const unitForums = ref([]);

const initSrlEnvironment = async () => {
  if (!props.courseId || !props.id || !props.userId) return;
  const coursePath = `courses/${props.courseId}`;
  const tracePath = `student_traces/${props.userId}_${props.id}`;

  try {
    isContentLoading.value = true;

    // 1. 恢復學習軌跡
    const traceSnap = await get(dbRef(rtdb, tracePath));
    if (traceSnap.exists()) {
      const tData = traceSnap.val();
      elapsedTime.value = tData.totalSeconds || 0;
      traceData.value = {
        videoMins: 0,
        readingMins: 0,
        errorCount: 0,
        ...tData,
      };
      console.log(`⏱️ 恢復學習進度：從 ${formattedTime.value} 接續`);
    }

    // 2. 讀取學生 Profile 與實驗分組
    const profileSnap = await get(
      dbRef(rtdb, `${coursePath}/profiles/${props.userId}`),
    );
    if (profileSnap.exists()) {
      const profile = profileSnap.val();
      if (profile.groupId) {
        const featSnap = await get(
          dbRef(
            rtdb,
            `${coursePath}/experiment/groups/${profile.groupId}/features`,
          ),
        );
        if (featSnap.exists()) Object.assign(activeFeatures, featSnap.val());
      }
      srlSession.value = profile.srl?.planning?.[props.id] || null;
    }

    // 3. 讀取單元資料與關聯資源
    const unitSnap = await get(dbRef(rtdb, `${coursePath}/units/${props.id}`));
    if (unitSnap.exists()) {
      const uData = unitSnap.val();
      unitTitle.value = uData.title || "未命名單元";

      const [mSnaps, eSnaps, aSnaps, fSnaps] = await Promise.all([
        uData.materials
          ? Promise.all(
              uData.materials.map((id) =>
                get(dbRef(rtdb, `${coursePath}/materials/${id}`)),
              ),
            )
          : [],
        uData.exams
          ? Promise.all(
              uData.exams.map((id) =>
                get(dbRef(rtdb, `${coursePath}/exams/${id}`)),
              ),
            )
          : [],
        uData.assignments
          ? Promise.all(
              uData.assignments.map((id) =>
                get(dbRef(rtdb, `${coursePath}/assignments/${id}`)),
              ),
            )
          : [],
        uData.forums
          ? Promise.all(
              uData.forums.map((id) =>
                get(dbRef(rtdb, `${coursePath}/discussions/${id}`)),
              ),
            )
          : [],
      ]);

      unitMaterials.value = mSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.key, ...s.val() }));
      unitExams.value = eSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.key, ...s.val() }));
      unitAssignments.value = aSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.key, ...s.val() }));
      unitForums.value = fSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.key, ...s.val() }));

      if (unitMaterials.value.length > 0) {
        unitContent.value =
          unitMaterials.value.find((m) => m.fileUrl?.includes(".mp4")) ||
          unitMaterials.value[0];
      }
    }

    // 4. 啟動監控機制
    if (activeFeatures.monitoring) {
      await fetchMonitorData();
      startTimer();
    }

    // 🌟 關鍵修正：解決初始化時變數未定義的問題
    // 保險 A：如果 unitContent 已經有值了，直接啟動
    if (unitContent.value) {
      console.log("📖 教材已即時就緒，啟動閱讀計時");
      manageReadingTimer();
    } else {
      // 保險 B：如果還在載入，監聽它的變化，執行一次後銷毀
      const unwatchStart = watch(unitContent, (newVal) => {
        if (newVal) {
          console.log("📖 偵測內容載入，補啟動閱讀計時");
          manageReadingTimer();
          unwatchStart();
        }
      });
    }
  } catch (error) {
    console.error("🔥 單元環境初始化失敗:", error);
  } finally {
    isContentLoading.value = false;
  }
};

const fetchMonitorData = async () => {
  if (!activeFeatures.monitoring) return;
  isMonitorLoading.value = true;
  try {
    const statsSnap = await get(
      dbRef(rtdb, `courses/${props.courseId}/units/${props.id}/stats`),
    );
    if (statsSnap.exists()) topAverage.value = statsSnap.val().topAverage || 85;

    const tracePath = `student_traces/${props.userId}_${props.id}`;

    // 使用 onValue 監聽雲端數據
    onValue(dbRef(rtdb, tracePath), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // --- 🌟 防回彈邏輯：單向遞增檢查 ---
        const remoteReading = data.readingMins || 0;
        const localReading = traceData.value.readingMins || 0;

        const remoteVideo = data.videoMins || 0;
        const localVideo = traceData.value.videoMins || 0;

        // 只有雲端數值領先本地超過一定數值，或是本地還是 0 時才同步
        // 這樣可以防止 15 秒存檔週期內的舊數據把本地正在跑的秒數「拉回去」
        const shouldUpdateReading =
          localReading === 0 || remoteReading > localReading + 0.1;
        const shouldUpdateVideo =
          localVideo === 0 || remoteVideo > localVideo + 0.1;

        traceData.value = {
          ...traceData.value, // 先展開舊數據
          ...data, // 覆蓋雲端數據 (如 errorCount, reflection)
          // 針對會即時跳動的欄位進行鎖定判斷
          readingMins: shouldUpdateReading ? remoteReading : localReading,
          videoMins: shouldUpdateVideo ? remoteVideo : localVideo,
        };

        // 總秒數同步 (Header 計時器)
        // 同樣道理：如果本地正在跑，且雲端數據比較舊，則不覆蓋
        if (
          data.totalSeconds &&
          (data.totalSeconds > elapsedTime.value || elapsedTime.value === 0)
        ) {
          elapsedTime.value = data.totalSeconds;
        }

        lastUpdateTime.value = new Date().toLocaleTimeString();
      }
    });
  } finally {
    isMonitorLoading.value = false;
  }
};

// --- 🌟 8. AI 智慧改善建議 (真 AI 串接版 + 防呆追蹤) ---

// 記錄上次檢查的時間點與錯誤數，防止重複觸發
const lastAiCheckMin = ref(-1);
const lastProcessedErrorCount = ref(0);

/**
 * 核心 Function：呼叫 AI 服務獲取藥石建議
 */
/**
 * 🌟 核心：向真 AI 服務請求診斷建議
 */
const triggerAiDiagnostic = async () => {
  // 防呆：功能沒開、正在思考中、或沒資料就跳過
  if (!activeFeatures.aiAdvice || isAiThinking.value) return;

  isAiThinking.value = true;

  try {
    // 1. 準備數據 Context (必須對齊 AiService.js 的欄位)
    const context = {
      unitTitle: unitTitle.value || "未命名單元",
      videoMins: Number(traceData.value.videoMins || 0),
      readingMins: Number(traceData.value.readingMins || 0),
      errorCount: Number(traceData.value.errorCount || 0),
      topAverage: Number(topAverage.value || 85),
      elapsedTime: Math.floor(elapsedTime.value / 60),
      plannedTime: Number(srlSession.value?.targetTime || 0),
    };

    console.group("🚀 [真 AI 診斷啟動]");
    console.log("📊 數據上下文:", context);
    console.groupEnd();

    // 2. 🌟 呼叫真 AI 服務
    const aiResult = await AiService.getLearningAdvice(context);

    // 3. 將結果更新到畫面
    if (aiResult) {
      aiStrategies.value = [aiResult];
      console.log("✅ [AI 回應成功]:", aiResult);
    }

    lastUpdateTime.value = new Date().toLocaleTimeString();
    lastProcessedErrorCount.value = context.errorCount; // 更新防呆標記
  } catch (error) {
    console.error("❌ AI 診斷連線失敗:", error);
    aiStrategies.value = ["AI 導師目前連線繁忙，請繼續您的學習。"];
  } finally {
    isAiThinking.value = false;
  }
};

/**
 * 🌟 核心監聽：判斷「藥石」跳出時機
 */
watch(
  () => traceData.value,
  (newData) => {
    if (!activeFeatures.aiAdvice || !newData) return;

    // 判斷是否偵測到新錯誤 (由 0 變 1, 1 變 2 等)
    const currentError = newData.errorCount || 0;
    const hasNewError = currentError > lastProcessedErrorCount.value;

    // 判斷是否每 5 分鐘
    const currentMin = Math.floor(elapsedTime.value / 60);
    const isTimeStep =
      currentMin > 0 &&
      currentMin % 5 === 0 &&
      currentMin !== lastAiCheckMin.value;

    if (hasNewError || isTimeStep) {
      if (isTimeStep) lastAiCheckMin.value = currentMin;
      console.log(
        `🎯 診斷觸發原因: ${hasNewError ? "錯誤增加" : "時間檢查點"}`,
      );
      triggerAiDiagnostic();
    }
  },
  { deep: true },
);

onMounted(initSrlEnvironment);
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (readingTimer) clearInterval(readingTimer);
});

watch(activeTab, manageReadingTimer);

const goBack = () =>
  router.push({
    name: "StuCourseDetail",
    params: { courseId: props.courseId },
  });

const handleFinish = async () => {
  const result = await Swal.fire({
    title: "完成學習？",
    text: "建議進行最後的反思。",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4a70a9",
    confirmButtonText: "開始反思",
  });
  if (result.isConfirmed) showEvalModal.value = true;
};

const showExamModal = ref(false);
const showHwModal = ref(false);
const showDiscussModal = ref(false);
const activeTaskId = ref(null);

const startExam = (examId) => {
  activeTaskId.value = examId;
  showExamModal.value = true;
};
const startHw = (hwId) => {
  activeTaskId.value = hwId;
  showHwModal.value = true;
};
const enterDiscussion = (disId) => {
  activeTaskId.value = disId;
  showDiscussModal.value = true;
};

const handleModalClose = async (type) => {
  showExamModal.value = false;
  showHwModal.value = false;
  showDiscussModal.value = false;
  activeTaskId.value = null;
  if (type === "exam" || type === "hw") await fetchMonitorData();
};

const onEvalConfirm = async (evalData) => {
  try {
    const tracePath = `student_traces/${props.userId}_${props.id}`;
    await update(dbRef(rtdb, tracePath), {
      reflection: evalData,
      isFinished: true,
      completedAt: serverTimestamp(),
      totalElapsedTimeMins: Math.floor(elapsedTime.value / 60),
      lastActive: serverTimestamp(),
    });
    showEvalModal.value = false;
    await Swal.fire({
      title: "任務全數達成！",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });
    router.push({
      name: "StuCourseDetail",
      params: { courseId: props.courseId },
    });
  } catch (error) {
    console.error("🔥 存檔失敗:", error);
  }
};
</script>
