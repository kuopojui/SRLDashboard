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
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <label class="section-label-v2 mb-0">班級領先群對照</label>
                <div class="btn-group btn-group-sm">
                  <button
                    v-for="type in ['exam', 'hw', 'time']"
                    :key="type"
                    @click="monitorMode = type"
                    :class="[
                      'btn',
                      monitorMode === type
                        ? 'btn-navy-sm'
                        : 'btn-outline-navy-sm',
                    ]"
                  >
                    {{
                      type === "exam" ? "測驗" : type === "hw" ? "功課" : "時間"
                    }}
                  </button>
                </div>
              </div>

              <div
                class="comparison-card p-4 rounded-4 bg-white border-dashed-soft shadow-xs"
              >
                <div
                  class="d-flex justify-content-around align-items-end chart-area"
                  style="height: 160px; padding-bottom: 25px"
                >
                  <div class="v-bar-container">
                    <div
                      class="v-bar my-score"
                      :style="{ height: (displayData.myPercent || 0) + '%' }"
                    >
                      <span class="bar-val">
                        {{ displayData.myVal
                        }}{{ monitorMode === "time" ? "m" : "" }}
                      </span>
                    </div>
                    <span class="bar-label">我的{{ displayData.label }}</span>
                  </div>

                  <div class="v-bar-container">
                    <div
                      class="v-bar top-score"
                      :style="{ height: (displayData.topPercent || 0) + '%' }"
                    >
                      <span class="bar-val">
                        {{ displayData.topVal
                        }}{{ monitorMode === "time" ? "m" : "" }}
                      </span>
                    </div>
                    <span class="bar-label">領先平均</span>
                  </div>
                </div>

                <div
                  class="gap-indicator-v2 mt-3"
                  :class="displayData.gap >= 0 ? 'is-positive' : 'is-negative'"
                >
                  <i
                    class="bi"
                    :class="
                      displayData.gap >= 0
                        ? 'bi-graph-up'
                        : 'bi-patch-exclamation'
                    "
                  ></i>
                  <span>{{ displayData.message }}</span>
                </div>
              </div>
            </div>

            <!-- 🌟 重點：使用 v-if 根據教師端設定決定是否渲染整個 AI 區塊 -->
            <div v-if="activeFeatures.aiAdvice" class="monitor-section mb-4">
              <label class="section-label-v2">改善建議</label>
              <div
                class="ai-chat-box p-3 rounded-4 shadow-sm border-start border-4 border-primary"
              >
                <!-- 標題與 Loading 狀態 -->
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
                  <!-- 骨架屏 (Skeleton)：AI 思考時顯示 -->
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

                  <!-- 策略列表 -->
                  <div v-else class="strategy-list-container">
                    <Transition name="fade" mode="out-in">
                      <!-- 有建議內容時 -->
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

                      <!-- 無建議內容時 (空狀態) -->
                      <div
                        v-else
                        key="empty-state"
                        class="ai-reply-pill opacity-75 italic text-center py-4 bg-light rounded-3"
                      >
                        <i class="bi bi-shield-check me-2 text-success"></i>
                        目前學習狀況穩定，請繼續保持！
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
                <div class="card-body p-4">
                  <div class="tab-content-wrapper">
                    <div v-if="activeTab === 'material'" class="material-view">
                      <div v-if="isContentLoading" class="py-5 text-center">
                        <div class="spinner-border text-primary mb-2"></div>
                        <p class="text-muted">正在準備單元教材...</p>
                      </div>

                      <div v-else-if="unitContent" class="material-active-area">
                        <div
                          v-if="
                            unitContent.fileUrl?.toLowerCase().includes('.mp4')
                          "
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
                            class="p-3 border border-top-0 rounded-bottom-4 d-flex justify-content-between align-items-center bg-white text-start"
                          >
                            <h6 class="fw-bold mb-0 text-navy">
                              <i class="bi bi-play-btn me-2"></i
                              >{{ unitContent.title }}
                            </h6>
                            <span
                              class="badge bg-primary-subtle text-primary border border-primary-subtle"
                            >
                              影片觀看：{{ traceData.videoMins.toFixed(1) }} min
                            </span>
                          </div>
                        </div>

                        <div
                          v-else-if="
                            unitContent.materialType === 'reading' ||
                            unitContent.fileUrl === 'reading_mode'
                          "
                          class="reading-prompt-section mb-4"
                        >
                          <div
                            class="card border-0 shadow-sm rounded-4 overflow-hidden"
                          >
                            <div
                              class="card-header bg-success-subtle border-0 p-3 d-flex justify-content-between align-items-center"
                            >
                              <span class="fw-bold text-success small">
                                <i class="bi bi-book-half me-2"></i
                                >此為線下教材讀書 (計時中)
                              </span>
                              <span
                                class="badge bg-white text-success border border-success-subtle"
                              >
                                累計時間：{{
                                  traceData.readingMins.toFixed(1)
                                }}
                                min
                              </span>
                            </div>
                            <div class="card-body p-4 bg-white text-start">
                              <div
                                class="teacher-instruction-box p-4 rounded-4 shadow-sm"
                                style="
                                  background-color: #fdfdfd;
                                  border: 1px solid #e9ecef;
                                  border-left: 6px solid #198754;
                                "
                              >
                                <h6 class="fw-bold text-dark mb-3">
                                  <i
                                    class="bi bi-chat-left-quote-fill text-success me-2"
                                  ></i
                                  >教師學習指引：
                                </h6>
                                <p
                                  class="fs-6 text-secondary mb-0 leading-relaxed"
                                  style="white-space: pre-wrap"
                                >
                                  {{
                                    unitContent.description ||
                                    "請依照老師提供的紙本教材或指定章節進行閱讀學習。"
                                  }}
                                </p>
                              </div>
                              <div
                                class="mt-3 py-2 px-3 bg-light rounded-3 d-flex align-items-center"
                              >
                                <i
                                  class="bi bi-info-circle text-muted me-2 small"
                                ></i>
                                <span class="text-muted small italic"
                                  >系統提示：此單元旨在導引實體閱讀，不提供檔案下載。</span
                                >
                              </div>
                            </div>
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
                              <span class="fw-bold small">
                                <i class="bi bi-file-earmark-pdf me-2"></i
                                >{{ unitContent.title }}
                              </span>
                              <span
                                class="badge bg-info-subtle text-info border border-info-subtle"
                              >
                                閱讀計時：{{
                                  traceData.readingMins.toFixed(1)
                                }}
                                min
                              </span>
                            </div>
                            <div
                              class="card-body p-0 bg-light"
                              style="height: 60vh"
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

                        <div
                          v-else-if="
                            unitContent.fileUrl &&
                            unitContent.fileUrl !== 'reading_mode'
                          "
                          class="download-section mb-4"
                        >
                          <div
                            class="card border-dashed p-5 text-center bg-white rounded-4 shadow-sm"
                          >
                            <i
                              class="bi bi-file-earmark-arrow-down display-2 text-navy opacity-50 mb-3"
                            ></i>
                            <h5 class="fw-bold text-navy">
                              {{ unitContent.title }}
                            </h5>
                            <p class="text-muted small mb-4">
                              此文件格式無法直接預覽，請點擊下方按鈕下載學習。
                            </p>
                            <button
                              @click="handleDownload(unitContent)"
                              class="btn btn-navy rounded-pill px-5"
                            >
                              <i class="bi bi-cloud-download me-2"></i
                              >下載學習文件
                            </button>
                          </div>
                        </div>

                        <div class="material-list-section mt-4 text-start">
                          <label class="section-label-v2 mb-2"
                            >單元教材清單</label
                          >
                          <div
                            class="list-group rounded-4 border-0 shadow-sm overflow-hidden"
                          >
                            <button
                              v-for="(mat, mIdx) in unitMaterials"
                              :key="mIdx"
                              class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3"
                              :class="{
                                'active bg-navy-light text-navy fw-bold':
                                  unitContent.id === mat.id,
                              }"
                              @click="switchMaterial(mat)"
                            >
                              <div class="d-flex align-items-center small">
                                <i
                                  :class="[
                                    mat.fileUrl?.toLowerCase().includes('.mp4')
                                      ? 'bi bi-play-circle-fill me-3'
                                      : mat.fileUrl
                                            ?.toLowerCase()
                                            .includes('.pdf')
                                        ? 'bi bi-file-earmark-pdf-fill me-3 text-danger'
                                        : mat.materialType === 'reading'
                                          ? 'bi bi-book-half me-3 text-success'
                                          : 'bi bi-file-earmark-arrow-down me-3',
                                  ]"
                                ></i>
                                <span>{{ mat.title }}</span>
                              </div>
                              <i
                                v-if="unitContent.id === mat.id"
                                class="bi bi-check-circle-fill text-primary"
                              ></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else-if="activeTab === 'quiz'" class="quiz-view">
                      <h5 class="fw-bold text-navy mb-4">
                        <i class="bi bi-card-checklist me-2"></i>單元測驗任務
                      </h5>
                      <div v-if="unitExams.length" class="list-group gap-3">
                        <div
                          v-for="ex in unitExams"
                          :key="ex.id"
                          class="card border rounded-4 p-3 shadow-sm bg-white"
                        >
                          <div
                            class="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <h6 class="fw-bold mb-1">{{ ex.title }}</h6>
                              <small class="text-muted"
                                >時長：{{ ex.duration }} 分 | 總分：{{
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
                        class="list-group gap-3"
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
                                >截止：{{ hw.deadline || "未設定" }}</small
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

                    <div
                      v-else-if="activeTab === 'discuss'"
                      class="discuss-view"
                    >
                      <div
                        class="d-flex justify-content-between align-items-center mb-4"
                      >
                        <h5 class="fw-bold text-navy mb-0">
                          <i class="bi bi-chat-dots me-2"></i>單元討論區
                        </h5>
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
                              <small class="text-muted text-truncate d-block">{{
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
                  v-model="noteText"
                  class="form-control mb-3 border-light bg-light small"
                  rows="8"
                  placeholder="輸入您的思考..."
                ></textarea>
                <button
                  @click="handleSaveNote"
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
              v-if="showEvalModal"
              :srlSession="srlSessionData"
              :plannedMins="srlSessionData.targetTime"
              :actualMins="Math.floor(elapsedTime / 60)"
              :isOpen="showEvalModal"
              @confirm="onEvalConfirm"
              @close="showEvalModal = false"
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
import { recordStudentAction as recordAction } from "../../utils/logger.js";

const props = defineProps({ courseId: String, id: String, userId: String });
const router = useRouter();

// --- 1. UI 狀態控制 ---
const showMonitor = ref(false);
const showEvalModal = ref(false);
const activeTab = ref("material");
const unitTitle = ref("");
const isMonitorLoading = ref(false);
const isContentLoading = ref(false);
const lastUpdateTime = ref("");
const noteText = ref(""); // 🌟 新增：筆記內容變數
// --- 1. UI 狀態控制 ---
const isLocked = ref(false); // 🌟 新增：是否進入唯讀結案模式

// 個人數據 (這些通常是從 Firebase 讀取後更新的)
const hwScore = ref(0);
const totalTime = ref(0);

// 領先群數據 (Top 25% 平均值)
const topHwAverage = ref(0);
const topTimeAverage = ref(0);

const tabs = [
  { id: "material", label: "課程教材", icon: "bi bi-book" },
  { id: "quiz", label: "單元檢測", icon: "bi bi-card-checklist" },
  { id: "hw", label: "功課提交", icon: "bi bi-file-earmark-arrow-up" },
  { id: "discuss", label: "討論區", icon: "bi bi-chat-dots" },
];

const isAiThinking = ref(false);

// 在 reactive 變數附近新增
const tracePath = computed(() => {
  if (!props.courseId || !props.id || !props.userId) return "";
  // 🌟 統一指向 course 內部的正確路徑
  return `courses/${props.courseId}/units/${props.id}/student_traces/${props.userId}`;
});

// --- 2. 實驗組功能開關與 Prompt 指令 ---
const activeFeatures = reactive({
  planning: false,
  monitoring: false,
  aiAdvice: false,
  reflection: false,
  isLeaderboardAnonymous: false,
});

// 🌟 新增：儲存教師設定的自定義指令
const experimentPrompts = reactive({
  global: "", // 全域教師指令 (settings.teacherPrompt)
  group: "", // 組別指令 (groups[id].aiCustomPrompt)
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

// --- 1. 教材切換邏輯 (強化行為追蹤與類型識別) ---
const switchMaterial = (mat) => {
  if (!mat) return;

  // 1. 更新當前選中教材
  unitContent.value = mat;
  lastTrackTime.value = 0; // 重置影片追蹤起點

  // 🌟 核心更新：根據資料庫結構進行精準類型判定
  let currentType = "file"; // 預設為普通文件
  const url = mat.fileUrl?.toLowerCase() || "";

  if (url.includes(".mp4")) {
    currentType = "video";
  }
  // 優先判定線下讀書：對應資料庫中的 materialType: "reading"
  else if (mat.materialType === "reading" || url === "reading_mode") {
    currentType = "reading";
  } else if (url.includes(".pdf")) {
    currentType = "pdf";
  }

  // 2. 紀錄行為 (紀錄精確的教材類型用於後續分析)
  recordAction(props.courseId, `切換學習教材：${mat.title}`, {
    unitId: props.id,
    materialId: mat.id || mat.firebaseKey,
    materialTitle: mat.title,
    materialType: currentType, // 將存入 "video", "reading", "pdf", 或 "file"
    timestamp: Date.now(),
  });

  // 3. 重新啟動計時器
  // 影片類會由影片播放器的 timeupdate 處理，非影片類則啟動閱讀計時
  manageReadingTimer();
};

// --- 2. 影片觀看時長追蹤 (自動同步至監控中心) ---
const handleVideoProgress = () => {
  if (!videoPlayerRef.value) return;

  const current = videoPlayerRef.value.currentTime;
  // 計算自上次追蹤以來的秒數差
  const delta = current - lastTrackTime.value;

  // 僅在正常播放時(delta 為正且小於 2 秒，排除快轉)累積時間
  if (delta > 0 && delta < 2) {
    const addedMins = delta / 60;

    // 更新本地監控數據 (這會直接反應在「自我調節監控中心」的畫面上)
    traceData.value.videoMins += addedMins;

    // 🌟 每累積約 5 秒或特定頻率同步至 Firebase，確保數據持久化
    if (Math.floor(current) % 5 === 0) {
      const tracePath = `student_traces/${props.userId}_${props.id}`;
      update(dbRef(rtdb, tracePath.value), {
        videoMins: traceData.value.videoMins,
        lastActive: serverTimestamp(),
      });
    }
  }

  // 更新基準點
  lastTrackTime.value = current;
};

const manageReadingTimer = () => {
  if (readingTimer) clearInterval(readingTimer);

  // 🌟 判定條件：必須在教材分頁、有教材內容、且類型不是影片
  const isReadingMode =
    activeTab.value === "material" &&
    unitContent.value &&
    (unitContent.value.type === "reading" ||
      !unitContent.value.fileUrl?.toLowerCase().includes(".mp4"));

  if (isReadingMode) {
    readingTimer = setInterval(() => {
      if (!traceData.value.readingMins) traceData.value.readingMins = 0;

      // 累積閱讀分鐘數
      traceData.value.readingMins += 1 / 60;

      const currentSecs = Math.floor(traceData.value.readingMins * 60);

      // 每 15 秒同步一次到 Firebase，確保數據持久化
      if (currentSecs > 0 && currentSecs % 15 === 0) {
        update(dbRef(rtdb, tracePath.value), {
          readingMins: traceData.value.readingMins,
          lastActive: serverTimestamp(),
        });
      }
    }, 1000);
  }
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedTime.value++;
    if (elapsedTime.value % 10 === 0) {
      update(dbRef(rtdb, tracePath.value), {
        totalSeconds: elapsedTime.value,
        lastActive: serverTimestamp(),
      });
    }
  }, 1000);
};

// 🌟 新增：處理教材下載並紀錄行為
// --- 🌟 修正：教材下載紀錄與開啟視窗 ---
const handleDownload = (mat) => {
  if (!mat || !mat.fileUrl) return;

  // 1. 紀錄 Log
  recordAction(props.courseId, "點擊下載教材", {
    unitId: props.id,
    materialTitle: mat.title,
    fileUrl: mat.fileUrl,
  });

  // 2. 觸發開啟新視窗 (下載文件)
  window.open(mat.fileUrl, "_blank");
};

// --- 🌟 修正：儲存筆記與行為紀錄 (統一存放在單元節點) ---
const handleSaveNote = async () => {
  const content = noteText.value.trim();

  // 1. 防呆：如果沒輸入內容就不紀錄
  if (!content) {
    Swal.fire({
      title: "請輸入筆記內容",
      icon: "warning",
      toast: true,
      position: "top-end",
      timer: 2000,
    });
    return;
  }

  try {
    // 🌟 修正路徑：統一存放在 課程 -> 單元 -> student_traces -> [學生ID] 之下
    // 此路徑能確保筆記與該單元的 readingMins, totalSeconds 等數據整合在一起
    const tracePath = `courses/${props.courseId}/units/${props.id}/student_traces/${props.userId}`;

    // 2. 實際存檔到 Firebase (移除原本錯誤的 .value)
    // 修正點：tracePath 是字串，直接傳入 dbRef 即可
    await update(dbRef(rtdb, tracePath), {
      note: content,
      lastActive: serverTimestamp(),
    });

    // 3. 紀錄 Log 行為 (用於 SRL 行為路徑分析)
    recordAction(props.courseId, "儲存學習筆記", {
      unitId: props.id,
      contentLength: content.length, // 紀錄字數有助於分析學生的監控深度
    });

    // 成功提示
    Swal.fire({
      icon: "success",
      title: "筆記已儲存",
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (e) {
    console.error("❌ 筆記儲存失敗:", e);

    // 紀錄失敗 Log 供除錯參考
    recordAction(props.courseId, "筆記儲存失敗", {
      unitId: props.id,
      errorMessage: e.message,
    });

    Swal.fire("錯誤", "儲存失敗，請檢查網路連線", "error");
  }
};

// --- 7. 核心初始化 ---
const unitExams = ref([]);
const unitAssignments = ref([]);
const unitForums = ref([]);

const initSrlEnvironment = async () => {
  if (!props.courseId || !props.id || !props.userId) return;

  const coursePath = `courses/${props.courseId}`;
  const unitPath = `${coursePath}/units/${props.id}`;
  const studentTracePath = `${unitPath}/student_traces/${props.userId}`;

  try {
    isContentLoading.value = true;

    // 1. 讀取學生在該單元的軌跡數據
    const traceSnap = await get(dbRef(rtdb, studentTracePath));
    if (traceSnap.exists()) {
      const tData = traceSnap.val();
      elapsedTime.value = tData.totalSeconds || 0;
      isLocked.value = tData.isFinished || false;

      traceData.value = {
        videoMins: 0,
        readingMins: 0,
        errorCount: 0,
        ...tData,
      };
    }

    // 2. 獲取實驗專區設定：全域教師指令
    const settingsSnap = await get(
      dbRef(rtdb, `${coursePath}/experiment/settings`),
    );
    if (settingsSnap.exists()) {
      experimentPrompts.global = settingsSnap.val().teacherPrompt || "";
    }

    // 3. 獲取學生 Profile 與組別功能開關 (這是關閉 AI 的關鍵)
    const profileSnap = await get(
      dbRef(rtdb, `${coursePath}/profiles/${props.userId}`),
    );
    if (profileSnap.exists()) {
      const profile = profileSnap.val();

      if (profile.groupId) {
        const groupSnap = await get(
          dbRef(rtdb, `${coursePath}/experiment/groups/${profile.groupId}`),
        );

        if (groupSnap.exists()) {
          const groupData = groupSnap.val();

          // 🌟 修正：明確更新功能開關，確保 aiAdvice 被讀取
          if (groupData.features) {
            activeFeatures.aiAdvice = !!groupData.features.aiAdvice;
            activeFeatures.monitoring = !!groupData.features.monitoring;
            activeFeatures.planning = !!groupData.features.planning;
            activeFeatures.reflection = !!groupData.features.reflection;
            activeFeatures.isLeaderboardAnonymous =
              !!groupData.features.isLeaderboardAnonymous;
          }

          // 讀取組別自定義 Prompt
          experimentPrompts.group = groupData.aiCustomPrompt || "";

          // 🌟 核心修正：如果讀到 AI 是關閉的，立即清空狀態防止殘留
          if (!activeFeatures.aiAdvice) {
            aiStrategies.value = [];
            isAiThinking.value = false;
            console.log("🚫 [實驗控制] 本組別 AI 建議功能已關閉");
          }
        }
      }
      srlSession.value = profile.srl?.planning?.[props.id] || null;
    }

    // 4. 獲取單元詳細資料 (教材、測驗等)
    // 4. 獲取單元詳細資料 (教材、測驗等)
    const unitSnap = await get(dbRef(rtdb, unitPath));

    if (unitSnap.exists()) {
      const uData = unitSnap.val();

      // 🌟 修正點 1：立即更新標題並紀錄行為，確保 Log 與當前單元一致
      unitTitle.value = uData.title || "未命名單元";

      recordAction(props.courseId, `進入單元頁面：${unitTitle.value}`, {
        unitId: props.id,
        plannedTime: srlSession.value?.targetTime,
        isLocked: isLocked.value,
      });

      try {
        // 批量讀取 (保持原 Promise.all 邏輯，但增加空陣列保護)
        const [mSnaps, eSnaps, aSnaps, fSnaps] = await Promise.all([
          uData.materials && Array.isArray(uData.materials)
            ? Promise.all(
                uData.materials.map((mid) =>
                  get(dbRef(rtdb, `${coursePath}/materials/${mid}`)),
                ),
              )
            : [],
          uData.exams && Array.isArray(uData.exams)
            ? Promise.all(
                uData.exams.map((eid) =>
                  get(dbRef(rtdb, `${coursePath}/exams/${eid}`)),
                ),
              )
            : [],
          uData.assignments && Array.isArray(uData.assignments)
            ? Promise.all(
                uData.assignments.map((aid) =>
                  get(dbRef(rtdb, `${coursePath}/assignments/${aid}`)),
                ),
              )
            : [],
          uData.forums && Array.isArray(uData.forums)
            ? Promise.all(
                uData.forums.map((fid) =>
                  get(dbRef(rtdb, `${coursePath}/discussions/${fid}`)),
                ),
              )
            : [],
        ]);

        // 🌟 修正點 2：清空舊資料再賦值，防止切換單元時資料殘留「多一個」
        unitMaterials.value = mSnaps
          .filter((s) => s && s.exists())
          .map((s) => ({ id: s.key, ...s.val() }));
        unitExams.value = eSnaps
          .filter((s) => s && s.exists())
          .map((s) => ({ id: s.key, ...s.val() }));
        unitAssignments.value = aSnaps
          .filter((s) => s && s.exists())
          .map((s) => ({ id: s.key, ...s.val() }));
        unitForums.value = fSnaps
          .filter((s) => s && s.exists())
          .map((s) => ({ id: s.key, ...s.val() }));

        // 預設選中教材邏輯
        if (unitMaterials.value.length > 0) {
          unitContent.value =
            unitMaterials.value.find((m) =>
              m.fileUrl?.toLowerCase().includes(".mp4"),
            ) || unitMaterials.value[0];
        }
      } catch (batchError) {
        console.error("🔥 批量讀取單元組件失敗:", batchError);
      }
    } else {
      // 若單元不存在的處理
      unitTitle.value = "找不到該單元";
    }

    // 5. 啟動監控 (確保在功能開關讀取後才啟動)
    if (activeFeatures.monitoring) {
      await fetchMonitorData();
      if (!isLocked.value) {
        startTimer();
        if (unitContent.value) manageReadingTimer();
      }
    }

    // 紀錄進入 Log
    recordAction(props.courseId, `進入單元：${unitTitle.value}`, {
      unitId: props.id,
      isAiEnabled: activeFeatures.aiAdvice,
      isLocked: isLocked.value,
    });
  } catch (error) {
    console.error("🔥 單元環境初始化失敗:", error);
    Swal.fire("載入失敗", "無法取得課程設定", "error");
  } finally {
    isContentLoading.value = false;
  }
};
const fetchMonitorData = async () => {
  if (!activeFeatures.monitoring) return;
  isMonitorLoading.value = true;

  // 1. 定義路徑
  const allTracesRef = dbRef(
    rtdb,
    `courses/${props.courseId}/units/${props.id}/student_traces`,
  );
  const myTracePath = `courses/${props.courseId}/units/${props.id}/student_traces/${props.userId}`;

  // 🌟 核心更新：即時監聽「全班軌跡」以計算動態領先指標 (Top 25%)
  onValue(allTracesRef, (snapshot) => {
    const allData = snapshot.val() || {};
    const traceList = Object.values(allData);

    if (traceList.length > 0) {
      // --- A. 實時計算測驗領先群 (只要有分就計入) ---
      const examScores = traceList
        .map((t) => t.currentScore)
        .filter((s) => s !== undefined && s !== null)
        .sort((a, b) => b - a);

      if (examScores.length > 0) {
        const topCount = Math.max(1, Math.ceil(examScores.length * 0.25));
        const topSum = examScores.slice(0, topCount).reduce((a, b) => a + b, 0);
        topAverage.value = Math.round(topSum / topCount);
      }

      // --- B. 實時計算功課領先群 ---
      const hwScores = traceList
        .map((t) => t.hwScore)
        .filter((s) => s !== undefined && s !== null)
        .sort((a, b) => b - a);

      if (hwScores.length > 0) {
        const topCount = Math.max(1, Math.ceil(hwScores.length * 0.25));
        const topSum = hwScores.slice(0, topCount).reduce((a, b) => a + b, 0);
        topHwAverage.value = Math.round(topSum / topCount);
      }

      // --- C. 實時計算時間領先群 (投入最深的前 25%) ---
      const timeValues = traceList
        .map((t) => t.totalSeconds)
        .filter((s) => s > 0)
        .sort((a, b) => b - a);

      if (timeValues.length > 0) {
        const topCount = Math.max(1, Math.ceil(timeValues.length * 0.25));
        const topSum = timeValues.slice(0, topCount).reduce((a, b) => a + b, 0);
        topTimeAverage.value = Math.round(topSum / topCount);
      }
    }
  });

  // 2. 監聽「個人」即時數據更新
  onValue(dbRef(rtdb, myTracePath), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // 更新個人表現
      currentScore.value = data.currentScore || 0;
      hwScore.value = data.hwScore || 0;
      totalTime.value = data.totalSeconds || 0;

      // 處理教材詳細觀看數據
      const remoteReading = data.readingMins || 0;
      const localReading = traceData.value.readingMins || 0;
      const remoteVideo = data.videoMins || 0;
      const localVideo = traceData.value.videoMins || 0;

      const shouldUpdateReading =
        localReading === 0 || remoteReading > localReading + 0.1;
      const shouldUpdateVideo =
        localVideo === 0 || remoteVideo > localVideo + 0.1;

      traceData.value = {
        ...traceData.value,
        ...data,
        readingMins: shouldUpdateReading ? remoteReading : localReading,
        videoMins: shouldUpdateVideo ? remoteVideo : localVideo,
      };

      // 同步大計時器
      if (
        data.totalSeconds &&
        (data.totalSeconds > elapsedTime.value || elapsedTime.value === 0)
      ) {
        elapsedTime.value = data.totalSeconds;
      }

      lastUpdateTime.value = new Date().toLocaleTimeString();
    }
    isMonitorLoading.value = false;
  });
};

// --- 🌟 AI 智慧改善建議 ---
const lastAiCheckMin = ref(-1);
const lastProcessedErrorCount = ref(0);

const triggerAiDiagnostic = async () => {
  // 1. 🌟 物理阻斷：若功能關閉，強制清空所有狀態並立即返回
  // 這確保了「對照組」學生即便觸發了 watch，邏輯也會在此終止，不會進入 try-catch
  if (!activeFeatures.aiAdvice) {
    if (aiStrategies.value.length > 0) aiStrategies.value = [];
    isAiThinking.value = false;
    return;
  }

  // 2. 防止重複觸發 (防抖)
  if (isAiThinking.value) return;

  isAiThinking.value = true;

  try {
    // 3. 彙整診斷上下文 (用於論文中描述：AI 診斷模型輸入變項)
    const context = {
      unitTitle: unitTitle.value || "未命名單元",
      videoMins: Number(traceData.value.videoMins || 0),
      readingMins: Number(traceData.value.readingMins || 0),
      errorCount: Number(traceData.value.errorCount || 0),
      topAverage: Number(topAverage.value || 85),
      elapsedTime: Math.floor(elapsedTime.value / 60),
      plannedTime: Number(srlSession.value?.targetTime || 0),

      // 🌟 核心：注入教師自定義 Prompt 指令
      teacherGlobalPrompt: experimentPrompts.global || "",
      teacherGroupPrompt: experimentPrompts.group || "",
    };

    // 4. 呼叫 AiService
    const aiResult = await AiService.getLearningAdvice(context);

    // 5. 🌟 雙重檢查：回傳時檢查開關是否被動態關閉
    if (activeFeatures.aiAdvice && aiResult) {
      aiStrategies.value = [aiResult];
    } else {
      aiStrategies.value = [];
    }

    // 更新狀態紀錄
    lastUpdateTime.value = new Date().toLocaleTimeString();
    lastProcessedErrorCount.value = context.errorCount;

    // 6. 🌟 紀錄行為 Log (用於論文分析：實驗組觸發頻率與介入成效)
    recordAction(props.courseId, `觸發 AI 改善建議：${unitTitle.value}`, {
      unitId: props.id,
      errorCount: context.errorCount,
      elapsedTimeMins: context.elapsedTime,
      aiEnabled: activeFeatures.aiAdvice, // 紀錄此筆數據屬於實驗組
    });
  } catch (error) {
    console.error("❌ AI 診斷失敗:", error);
    // 僅在功能開啟時顯示佔位符，否則不干擾對照組
    if (activeFeatures.aiAdvice) {
      aiStrategies.value = ["AI 導師目前正在分析數據，請稍後..."];
    }
  } finally {
    isAiThinking.value = false;
  }
};

watch(
  () => traceData.value,
  (newData) => {
    if (!activeFeatures.aiAdvice || !newData) return;
    const currentError = newData.errorCount || 0;
    const hasNewError = currentError > lastProcessedErrorCount.value;
    const currentMin = Math.floor(elapsedTime.value / 60);
    const isTimeStep =
      currentMin > 0 &&
      currentMin % 5 === 0 &&
      currentMin !== lastAiCheckMin.value;
    if (hasNewError || isTimeStep) {
      if (isTimeStep) lastAiCheckMin.value = currentMin;
      triggerAiDiagnostic();
    }
  },
  { deep: true },
);

// 🌟 修正 2: 監聽分頁切換
watch(activeTab, (newTab) => {
  const tabNames = {
    material: "課程教材",
    quiz: "單元檢測",
    hw: "功課提交",
    discuss: "討論區",
  };
  recordAction(props.courseId, `切換單元分頁：${tabNames[newTab] || newTab}`, {
    unitId: props.id,
    unitTitle: unitTitle.value,
  });
  manageReadingTimer();
});

// 🌟 修正 3: 紀錄監控儀表板開啟
watch(showMonitor, (isOpen) => {
  if (isOpen) {
    recordAction(props.courseId, "開啟單元監控儀表板", {
      unitId: props.id,
      currentScore: currentScore.value,
      scoreGap: scoreGap.value,
      elapsedMins: Math.floor(elapsedTime.value / 60),
    });
  }
});

onMounted(initSrlEnvironment);
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (readingTimer) clearInterval(readingTimer);
});

const goBack = () =>
  router.push({
    name: "StuCourseDetail",
    params: { courseId: props.courseId },
  });

const handleFinish = async () => {
  // 🌟 1. 結案前置檢查：確保所有任務（測驗與功課）都有成績/已提交
  const hasQuiz = unitExams.value.length > 0;
  const hasHw = unitAssignments.value.length > 0;

  // 檢查邏輯：如果有任務，則 currentScore 或 hwScore 必須大於 0 (或依據您的提交狀態判定)
  const quizFinished =
    !hasQuiz ||
    (currentScore.value !== undefined && currentScore.value !== null);
  const hwFinished =
    !hasHw || (hwScore.value !== undefined && hwScore.value !== null);

  if (!quizFinished || !hwFinished) {
    await Swal.fire({
      title: "尚未完成單元任務",
      text: "請先完成並提交本單元的「測驗」與「功課」後，再進行反思結案。",
      icon: "warning",
      confirmButtonColor: "#4a70a9",
    });
    return;
  }

  // 🌟 2. 詢問是否結案
  const result = await Swal.fire({
    title: "確定完成學習？",
    text: "一旦進入反思階段，系統將停止計時，且此單元將轉為「唯讀模式」。",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4a70a9",
    confirmButtonText: "開始反思",
    cancelButtonText: "繼續學習",
  });

  if (result.isConfirmed) {
    // 🌟 3. 停止計時：立即清理計時器與閱讀追蹤
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (readingTimer) {
      clearInterval(readingTimer);
      readingTimer = null;
    }

    // 紀錄行為：開始反思
    recordAction(props.courseId, "觸發單元自我反思", {
      unitId: props.id,
      unitTitle: unitTitle.value,
      totalTimeSeconds: elapsedTime.value,
      action: "start_reflection",
    });

    // 開啟反思彈窗
    showEvalModal.value = true;
  } else {
    // 紀錄行為：取消完成
    recordAction(props.courseId, "取消完成學習", {
      unitId: props.id,
      action: "cancel_finish",
    });
  }
};
const showExamModal = ref(false);
const showHwModal = ref(false);
const showDiscussModal = ref(false);
const activeTaskId = ref(null);

// --- 🌟 修正：點擊測驗任務紀錄 ---
const startExam = (examId) => {
  const ex = unitExams.value.find((e) => e.id === examId);
  recordAction(props.courseId, "點擊進入單元測驗", {
    unitId: props.id,
    examId: examId,
    examTitle: ex ? ex.title : "未知測驗",
  });
  activeTaskId.value = examId;
  showExamModal.value = true;
};

// --- 🌟 修正：點擊功課任務紀錄 ---
const startHw = (hwId) => {
  const hw = unitAssignments.value.find((h) => h.id === hwId);
  recordAction(props.courseId, "點擊進入功課提交", {
    unitId: props.id,
    hwId: hwId,
    hwTitle: hw ? hw.title : "未知功課",
  });
  activeTaskId.value = hwId;
  showHwModal.value = true;
};

// --- 🌟 修正：點擊參與討論紀錄 ---
const enterDiscussion = (disId) => {
  const dis = unitForums.value.find((d) => d.id === disId);
  recordAction(props.courseId, "點擊參與討論區", {
    unitId: props.id,
    discussId: disId,
    discussTitle: dis ? dis.title : "未知討論",
  });
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
    // 🌟 更新路徑：確保寫入 courses/{courseId}/units/{unitId}/student_traces/{userId}
    const tracePath = `courses/${props.courseId}/units/${props.id}/student_traces/${props.userId}`;

    await update(dbRef(rtdb, tracePath), {
      reflection: evalData, // 儲存學生的自我反思內容
      isFinished: true, // 標記該單元已完成
      completedAt: serverTimestamp(), // 紀錄完工時間戳
      totalElapsedTimeMins: Math.floor(elapsedTime.value / 60), // 儲存最終投入的總分鐘數
      lastActive: serverTimestamp(), // 更新最後活動時間
    });

    showEvalModal.value = false;

    // 顯示成功提示
    await Swal.fire({
      title: "任務全數達成！",
      text: "您已完成本單元的自我調節學習循環。",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });

    // 行為紀錄：紀錄學生正式完成單元
    recordAction(props.courseId, `正式完成單元：${unitTitle.value}`, {
      unitId: props.id,
      totalMinutes: Math.floor(elapsedTime.value / 60),
    });

    // 返回課程主頁
    router.push({
      name: "StuCourseDetail",
      params: { courseId: props.courseId },
    });
  } catch (error) {
    console.error("🔥 單元結案存檔失敗:", error);
    Swal.fire("存檔失敗", "請檢查網路連線後重試", "error");
  }
};

const monitorMode = ref("exam"); // 預設顯示測驗

const displayData = computed(() => {
  let myVal, topVal, unit, label, max;

  if (monitorMode.value === "exam") {
    myVal = currentScore.value || 0;
    topVal = topAverage.value || 0;
    label = "得分";
    max = 100;
  } else if (monitorMode.value === "hw") {
    myVal = hwScore.value || 0;
    topVal = topHwAverage.value || 0;
    label = "功課";
    max = 100;
  } else {
    myVal = Math.round((totalTime.value || 0) / 60); // 轉為分鐘
    topVal = Math.round((topTimeAverage.value || 0) / 60);
    label = "時間";
    max = Math.max(myVal, topVal, 60); // 動態最大值，至少 60 分鐘
  }

  const gap = myVal - topVal;
  return {
    myVal,
    topVal,
    gap,
    myPercent: (myVal / max) * 100,
    topPercent: (topVal / max) * 100,
    label,
    message:
      gap >= 0
        ? `在${label}表現優異，請維持！`
        : `距離領先群${label}目標尚差 ${Math.abs(gap)}${monitorMode.value === "time" ? " 分鐘" : " 分"}`,
  };
});

// 🌟 封裝要傳遞給反思 Modal 的數據，確保路徑指令對齊
const srlSessionData = computed(() => {
  const base = srlSession.value || { targetTime: 90 };
  return {
    ...base,
    unitTitle: unitTitle.value,
    courseId: props.courseId,
    // 🌟 這裡必須對準 StuSRLEval.vue 內部的變數名稱
    teacherGlobalPrompt: experimentPrompts.global,
    teacherGroupPrompt: experimentPrompts.group,
    aiAdvice: activeFeatures.aiAdvice,
  };
});
</script>
