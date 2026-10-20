import {
  extension_settings,
  getContext,
} from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "rp-status-picker";

const defaultSettings = {
  categories: [
    { key: "charList", label: "角色", placeholder: "輸入角色名（如：小傑）", items: ["{{char}}", "{{user}}"] },
    { key: "topList", label: "上衣", placeholder: "輸入上衣詞條...", items: ["白襯衫", "針織毛衣", "水手服", "運動背心", "風衣", "無（赤裸）"] },
    { key: "bottomList", label: "下身", placeholder: "輸入下身詞條...", items: ["百褶裙", "牛仔短褲", "OL包臀裙", "運動長褲", "無"] },
    { key: "legList", label: "腿部", placeholder: "輸入腿部/鞋襪詞條...", items: ["黑色連褲襪", "白色過膝襪", "裸足", "蕾絲吊帶襪", "高跟鞋"] },
    { key: "itemList", label: "道具", placeholder: "輸入道具詞條...", items: ["手機", "紅酒杯", "筆記本", "雨傘", "手銬", "無"] },
    { key: "mindList", label: "心理", placeholder: "輸入心理狀態詞條...", items: ["害羞閃躲", "表面冷淡內心動搖", "警惕防備", "期待又緊張", "順從"] }
  ],
  buttonPosition: null // 重置座標，防止卡在螢幕外
};

let selectedState = {};
let isDeleteMode = false;

function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  
  if (!Array.isArray(extension_settings[extensionName].categories)) {
    extension_settings[extensionName].categories = JSON.parse(JSON.stringify(defaultSettings.categories));
  }

  extension_settings[extensionName].categories.forEach(cat => {
    if (!selectedState[cat.key]) {
      selectedState[cat.key] = new Set();
    }
  });
}

function buildOutputText() {
  const categories = extension_settings[extensionName].categories || [];
  const lines = categories.map(cat => {
    const picked = Array.from(selectedState[cat.key] || []);
    return `${cat.label}：${picked.join("、")}`;
  });
  return `「${lines.join("\n")}」`;
}

function updatePreview() {
  $("#rp_picker_preview").val(buildOutputText());
}

function renderCategories() {
  loadSettings();
  const categories = extension_settings[extensionName].categories || [];
  const container = $("#rp_picker_categories");
  container.empty();

  categories.forEach(cat => {
    const items = cat.items || [];
    const chipsHtml = items.map(item => {
      if (!selectedState[cat.key]) selectedState[cat.key] = new Set();
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
      <div class="rp-block" data-cat-key="${cat.key}">
        <div class="rp-block-header">
          <div class="rp-title-area">
            <span class="rp-block-title">${cat.label}：</span>
            ${isDeleteMode ? `<button type="button" class="rp-del-row-btn" data-cat="${cat.key}" title="刪除整行">🗑️ 刪除整行</button>` : ''}
          </div>
          <div class="rp-inline-add">
            <input type="text" class="rp-input-new" data-cat="${cat.key}" placeholder="${cat.placeholder || '輸入新詞條...'}" />
            <button type="button" class="rp-btn-add" data-cat="${cat.key}">+ 新增</button>
          </div>
        </div>
        <div class="rp-chip-container">
          ${chipsHtml || '<span class="rp-empty">尚無詞條，請在上方新增</span>'}
        </div>
      </div>
    `;
    container.append(rowHtml);
  });

  updatePreview();
}

function initPluginUI() {
  try {
    if ($("#rp_picker_float_btn").length > 0) return;

    // 建立懸浮按鈕，強制初始位置在右側安全區，絕對不會跑出畫面
    const btnHtml = `
      <div id="rp_picker_float_btn" title="按住可拖拽位置，點擊打開">
        👗 狀態模板
      </div>
    `;
    $("body").append(btnHtml);
    
    const $btn =$("#rp_picker_float_btn");
    $btn.css({ right: "20px", bottom: "160px", left: "auto", top: "auto" });

    // 拖拽邏輯
    const el = document.getElementById("rp_picker_float_btn");
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    function onTouchStart(e) {
      const touch = e.touches ? e.touches[0] : e;
      isDragging = false;
      startX = touch.clientX;
      startY = touch.clientY;
      
      const rect = el.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      document.addEventListener("mousemove", onTouchMove);
      document.addEventListener("mouseup", onTouchEnd);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    }

    function onTouchMove(e) {
      const touch = e.touches ? e.touches[0] : e;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDragging = true;
      }

      if (isDragging) {
        if (e.cancelable) e.preventDefault();
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        newLeft = Math.max(5, Math.min(window.innerWidth - el.offsetWidth - 5, newLeft));
        newTop = Math.max(5, Math.min(window.innerHeight - el.offsetHeight - 5, newTop));

        el.style.left = newLeft + "px";
        el.style.top = newTop + "px";
        el.style.right = "auto";
        el.style.bottom = "auto";
      }
    }

    function onTouchEnd(e) {
      document.removeEventListener("mousemove", onTouchMove);
      document.removeEventListener("mouseup", onTouchEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);

      if (isDragging) {
        const rect = el.getBoundingClientRect();
        extension_settings[extensionName].buttonPosition = {
          left: rect.left + "px",
          top: rect.top + "px",
          right: "auto",
          bottom: "auto"
        };
        saveSettingsDebounced();
      } else {
        // 點擊打開彈窗
        renderCategories();
        $("#rp_picker_modal").fadeIn(150);
      }
    }

    el.addEventListener("mousedown", onTouchStart);
    el.addEventListener("touchstart", onTouchStart, { passive: true });

    // 彈出式視窗 Modal
    if ($("#rp_picker_modal").length === 0) {
      const modalHtml = `
        <div id="rp_picker_modal" style="display:none;">
          <div class="rp-modal-box">
            <div class="rp-modal-top">
              <b>角色狀態與換裝生成器</b>
              <div class="rp-top-controls">
                <button type="button" id="rp_btn_add_category" class="rp-ctrl-btn primary">+ 新增分類行</button>
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
    }

    $("#rp_btn_close").off("click").on("click", () => {
      isDeleteMode = false;
      $("#rp_btn_toggle_del").removeClass("active").text("管理/刪除詞條");
      $("#rp_picker_modal").fadeOut(150);
    });

    $("#rp_btn_toggle_del").off("click").on("click", function () {
      isDeleteMode = !isDeleteMode;
      $(this).toggleClass("active", isDeleteMode);
      $(this).text(isDeleteMode ? "完成管理" : "管理/刪除詞條");
      renderCategories();
    });

    $("#rp_btn_add_category").off("click").on("click", () => {
      const newLabel = prompt("請輸入新分類的名稱（例如：表情、動作、背景）：");
      if (!newLabel || !newLabel.trim()) return;

      const trimmedLabel = newLabel.trim();
      const newKey = "custom_" + Date.now();

      const categories = extension_settings[extensionName].categories;
      categories.push({
        key: newKey,
        label: trimmedLabel,
        placeholder: `輸入${trimmedLabel}詞條...`,
        items: []
      });

      selectedState[newKey] = new Set();
      saveSettingsDebounced();
      renderCategories();
      if (window.toastr) toastr.success(`已新增分類行：${trimmedLabel}`);
    });

    $(document).off("click", ".rp-chip").on("click", ".rp-chip", function () {
      const catKey = $(this).attr("data-cat");
      const val = $(this).attr("data-val");
      const categories = extension_settings[extensionName].categories;
      const catObj = categories.find(c => c.key === catKey);
      if (!catObj) return;

      if (isDeleteMode) {
        catObj.items = catObj.items.filter(x => x !== val);
        if (selectedState[catKey]) selectedState[catKey].delete(val);
        saveSettingsDebounced();
        renderCategories();
        return;
      }

      if (!selectedState[catKey]) selectedState[catKey] = new Set();
      if (selectedState[catKey].has(val)) {
        selectedState[catKey].delete(val);
      } else {
        selectedState[catKey].add(val);
      }
      renderCategories();
    });

    $(document).off("click", ".rp-del-row-btn").on("click", ".rp-del-row-btn", function () {
      const catKey = $(this).attr("data-cat");
      if (!confirm("確定要刪除整個分類行嗎？")) return;

      let categories = extension_settings[extensionName].categories;
      extension_settings[extensionName].categories = categories.filter(c => c.key !== catKey);
      delete selectedState[catKey];
      saveSettingsDebounced();
      renderCategories();
      if (window.toastr) toastr.success("已刪除該分類行");
    });

    $(document).off("click", ".rp-btn-add").on("click", ".rp-btn-add", function () {
      const catKey = $(this).attr("data-cat");
      const input = $(`.rp-input-new[data-cat="${catKey}"]`);
      const newVal = String(input.val() || "").trim();
      if (!newVal) return;

      const categories = extension_settings[extensionName].categories;
      const catObj = categories.find(c => c.key === catKey);
      if (!catObj) return;

      if (!catObj.items.includes(newVal)) {
        catObj.items.push(newVal);
        saveSettingsDebouncer ? saveSettingsDebouncer() : saveSettingsDebounced();
      }

      if (!selectedState[catKey]) selectedState[catKey] = new Set();
      selectedState[catKey].add(newVal);
      
      input.val("");
      renderCategories();
    });

    $(document).off("keydown", ".rp-input-new").on("keydown", ".rp-input-new", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const catKey = $(this).attr("data-cat");
        $(`.rp-btn-add[data-cat="${catKey}"]`).trigger("click");
      }
    });

    $("#rp_btn_clear").off("click").on("click", () => {
      Object.keys(selectedState).forEach(k => {
        if (selectedState[k]) selectedState[k].clear();
      });
      renderCategories();
    });

    $("#rp_btn_confirm").off("click").on("click", () => {
      const finalText = $("#rp_picker_preview").val();
      const replyBox = $("#send_textarea");
      const existing = String(replyBox.val() || "").trim();

      replyBox.val(existing ? `${existing}\n${finalText}` : finalText);
      replyBox.trigger("input");
      $("#rp_picker_modal").fadeOut(150);
      replyBox.trigger("focus");
      
      if (window.toastr) toastr.success("已成功填入聊天輸入框！");
    });
  } catch (err) {
    console.error("[RP Picker] initPluginUI Error:", err);
  }
}

jQuery(async () => {
  loadSettings();
  initPluginUI();
});
