import {
  extension_settings,
  getContext,
} from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "rp-status-picker";

// 預設的用戶資料庫（用戶可自行在介面中新增）
const defaultSettings = {
  charList: ["{{char}}", "{{user}}"],
  topList: ["白襯衫", "針織毛衣", "水手服", "運動背心", "風衣", "無（赤裸）"],
  bottomList: ["百褶裙", "牛仔短褲", "OL包臀裙", "運動長褲", "無"],
  legList: ["黑色連褲襪", "白色過膝襪", "裸足", "蕾絲吊帶襪", "高跟鞋"],
  itemList: ["手機", "紅酒杯", "筆記本", "雨傘", "手銬", "無"],
  mindList: ["害羞閃躲", "表面冷淡內心動搖", "警惕防備", "期待又緊張", "順從"]
};

const categoryMeta = [
  { key: "charList", label: "角色", placeholder: "輸入角色名（如：小傑）" },
  { key: "topList", label: "上衣", placeholder: "輸入上衣詞條..." },
  { key: "bottomList", label: "下身", placeholder: "輸入下身詞條..." },
  { key: "legList", label: "腿部", placeholder: "輸入腿部/鞋襪詞條..." },
  { key: "itemList", label: "道具", placeholder: "輸入道具詞條..." },
  { key: "mindList", label: "心理", placeholder: "輸入心理狀態詞條..." }
];

// 記錄當前被勾選的項目
let selectedState = {
  charList: new Set(),
  topList: new Set(),
  bottomList: new Set(),
  legList: new Set(),
  itemList: new Set(),
  mindList: new Set()
};

let isDeleteMode = false;

function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  for (const [key, val] of Object.entries(defaultSettings)) {
    if (!Array.isArray(extension_settings[extensionName][key])) {
      extension_settings[extensionName][key] = [...val];
    }
  }
}

// 根據勾選狀態生成最終文字
function buildOutputText() {
  const lines = categoryMeta.map(cat => {
    const picked = Array.from(selectedState[cat.key]);
    return `${cat.label}：${picked.join("、")}`;
  });
  return `「${lines.join("\n")}」`;
}

function updatePreview() {
  $("#rp_picker_preview").val(buildOutputText());
}

// 渲染介面與標籤
function renderCategories() {
  const settings = extension_settings[extensionName];
  const container = $("#rp_picker_categories");
  container.empty();

  categoryMeta.forEach(cat => {
    const items = settings[cat.key] || [];
    const chipsHtml = items.map(item => {
      const isSelected = selectedState[cat.key].has(item);
      const safeItem = $("<div>").text(item).html();
      return `
        <span class="rp-chip ${isSelected ? "selected" : ""} ${isDeleteMode ? "delete-mode" : ""}" 
              data-cat="${cat.key}" data-val="${safeItem}">
          ${safeItem} ${isDeleteMode ? "✕" : ""}
        </span>
      `;
    }).join("");

    const rowHtml = `
      <div class="rp-block">
        <div class="rp-block-header">
          <span class="rp-block-title">${cat.label}：</span>
          <div class="rp-inline-add">
            <input type="text" class="rp-input-new" data-cat="${cat.key}" placeholder="${cat.placeholder}" />
            <button type="button" class="rp-btn-add" data-cat="${cat.key}">+ 新增</button>
          </div>
        </div>
        <div class="rp-chip-container">
          ${chipsHtml || '<span class="rp-empty">尚無詞條</span>'}
        </div>
      </div>
    `;
    container.append(rowHtml);
  });

  updatePreview();
}

// 初始化外掛 UI（懸浮按鈕與彈窗）
function initPluginUI() {
  if ($("#rp_picker_float_btn").length > 0) return;

  // 1. 畫面右側懸浮按鈕
  $("body").append(`
    <div id="rp_picker_float_btn" title="打開 RP 狀態與換裝生成器">
      👗 狀態模板
    </div>
  `);

  // 2. 彈出式視窗 Modal
  const modalHtml = `
    <div id="rp_picker_modal" style="display:none;">
      <div class="rp-modal-box">
        <div class="rp-modal-top">
          <b>角色狀態與換裝生成器</b>
          <div>
            <button type="button" id="rp_btn_toggle_del" class="rp-ctrl-btn">管理/刪除詞條</button>
            <button type="button" id="rp_btn_close" class="rp-close-btn">✕</button>
          </div>
        </div>
        <div class="rp-modal-content" id="rp_picker_categories"></div>
        <div class="rp-modal-bottom">
          <textarea id="rp_picker_preview" rows="6"></textarea>
          <div class="rp-bottom-actions">
            <button type="button" id="rp_btn_clear" class="rp-act-btn secondary">清空已選</button>
            <button type="button" id="rp_btn_confirm" class="rp-act-btn primary">確定（填入回覆框）</button>
          </div>
        </div>
      </div>
    </div>
  `;
  $("body").append(modalHtml);

  // 綁定開關事件
  $("#rp_picker_float_btn").on("click", () => {
    renderCategories();
    $("#rp_picker_modal").fadeIn(150);
  });

  $("#rp_btn_close").on("click", () => {
    isDeleteMode = false;
    $("#rp_btn_toggle_del").removeClass("active").text("管理/刪除詞條");
    $("#rp_picker_modal").fadeOut(150);
  });

  // 切換刪除模式
  $("#rp_btn_toggle_del").on("click", function () {
    isDeleteMode = !isDeleteMode;
    $(this).toggleClass("active", isDeleteMode);
    $(this).text(isDeleteMode ? "完成管理" : "管理/刪除詞條");
    renderCategories();
  });

  // 點擊標籤：多選切換 或 刪除
  $(document).on("click", ".rp-chip", function () {
    const catKey = $(this).attr("data-cat");
    const val = $(this).attr("data-val");
    const list = extension_settings[extensionName][catKey];

    if (isDeleteMode) {
      extension_settings[extensionName][catKey] = list.filter(x => x !== val);
      selectedState[catKey].delete(val);
      saveSettingsDebounced(); // 自動防抖存入本地資料庫
      renderCategories();
      return;
    }

    if (selectedState[catKey].has(val)) {
      selectedState[catKey].delete(val);
    } else {
      selectedState[catKey].add(val);
    }
    renderCategories();
  });

  // 新增自訂詞條到用戶資料庫
  $(document).on("click", ".rp-btn-add", function () {
    const catKey = $(this).attr("data-cat");
    const input = $(`.rp-input-new[data-cat="${catKey}"]`);
    const newVal = String(input.val() || "").trim();
    if (!newVal) return;

    const list = extension_settings[extensionName][catKey];
    if (!list.includes(newVal)) {
      list.push(newVal);
      saveSettingsDebounced(); // 自動存入本地
    }
    selectedState[catKey].add(newVal);
    input.val("");
    renderCategories();
  });

  // 支援按 Enter 鍵新增
  $(document).on("keydown", ".rp-input-new", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const catKey = $(this).attr("data-cat");
      $(`.rp-btn-add[data-cat="${catKey}"]`).trigger("click");
    }
  });

  // 清空已選
  $("#rp_btn_clear").on("click", () => {
    Object.keys(selectedState).forEach(k => selectedState[k].clear());
    renderCategories();
  });

  // 【核心功能】按下確定後，浮現在回覆框 (reply blank)
  $("#rp_btn_confirm").on("click", () => {
    const finalText = $("#rp_picker_preview").val();
    const replyBox = $("#send_textarea"); // 酒館原生聊天輸入框
    const existing = String(replyBox.val() || "").trim();

    // 將生成的狀態文字追加到輸入框現有文字的下方
    replyBox.val(existing ? `${existing}\n${finalText}` : finalText);
    replyBox.trigger("input"); // 通知酒館前端更新狀態與輸入框高度
    $("#rp_picker_modal").fadeOut(150);
    replyBox.trigger("focus");
    
    if (window.toastr) toastr.success("已成功填入聊天輸入框！");
  });
}

jQuery(async () => {
  loadSettings();
  initPluginUI();
});