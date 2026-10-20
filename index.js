import {
  extension_settings,
  getContext,
} from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "rp-status-picker";

const defaultSettings = {
globalPrompt: `【角色狀態・必須嚴格遵守】以下區塊是當前角色的「即時狀態」，不是可選暗示。生成正文時必須與之一致，不得無視、不得自行改回「穿戴整齊／正常社交姿勢」，除非用戶明確寫出狀態變化。規則：
1. 服裝、暴露、姿勢、地點、道具以狀態區塊為準。
2. 狀態裡已寫「真空／開檔／跪好／被固定」等，正文必須體現，不能寫成相反。
3. 不要一次性自動結束調教或自行穿上衣服；保持狀態延續到用戶推進為止。
4. 心理／感官可描寫反應，但不得用「突然恢復理智並拒絕」直接推翻已給定的服從／姿勢狀態（除非用戶指示）。
5. 輸出劇情時把狀態自然寫進動作與感官，不要逐條復讀標籤。`,
  categories: [
    { key: "charList", label: "角色", placeholder: "輸入角色名（如：小傑）", items: ["{{char}}", "{{user}}"] },
    { key: "topList", label: "上衣", placeholder: "輸入上衣詞條...", items: ["白襯衫", "針織毛衣", "水手服", "運動背心", "風衣", "無（赤裸）", "OL襯衫", "緊身衣", "乳膠衣", "連體衣", "死庫水", "競泳泳衣", "比基尼", "微型比基尼", "吊帶", "抹胸", "露臍上衣", "西裝外套", "水手服", "旗袍", "圍裙（真空圍裙）", "毛巾", "只裹床單", "衣服被撕破", "衣服半脫", "衣服掀起"] },
    { key: "bottomList", label: "下身", placeholder: "輸入下身詞條...", items: ["百褶裙", "牛仔短褲", "OL包臀裙", "運動長褲", "無（下身真空）", "短裙", "長裙", "西裝褲", "睡褲", "開衩旗袍", "裙擺捲到腰", "褲子褪到膝", "只剩內褲"] },
    { key: "內衣List", label: "內衣", placeholder: "輸入內衣詞條...", items: ["無內衣", "薄蕾絲", "黑色胸罩", "白色胸罩", "半杯", "全罩", "前扣", "開襟", "乳貼", "透明內衣", "運動內衣", "吊帶睡裙內裏", "被汗浸濕", "肩帶滑落", "罩杯半脫"] },
    { key: "內褲List", label: "內褲", placeholder: "輸入內褲詞條...", items: ["無內褲", "棉質三角", "蕾絲丁字", "黑色丁字", "開檔", "濕透", "被撥到一側", "勒進縫裡", "半褪", "徹底褪下", "情趣綁帶", "幾乎透明"] },
    { key: "legList", label: "腿部", placeholder: "輸入腿部/鞋襪詞條...", items: ["黑色連褲襪", "白色過膝襪", "裸足", "蕾絲吊帶襪", "高跟鞋", "肉絲", "黑絲", "漁網襪", "短襪", "靴子", "鞋已踢掉", "襪口捲到小腿", "絲襪破了一點"] },
    { key: "道具List", label: "道具", placeholder: "輸入道具詞條...", items: ["項圈", "口塞", "眼罩", "手銬", "牽繩", "跳蛋", "遙控跳蛋", "乳夾", "按摩棒", "皮帶", "領帶（束手）", "絲巾", "潤滑液", "假陽具", "眼罩＋口塞"] },
    { key: "身體暴露List", label: "身體暴露", placeholder: "輸入身體暴露詞條...", items: ["領口大開", "肩帶滑落", "裙擺掀起", "側乳露出", "下乳可見", "背部全露", "小腹露出", "腿根可見", "幾乎全裸", "只遮關鍵處", "從背後一覽無餘", "衣物凌亂"] },
    { key: "姿勢List", label: "姿勢", placeholder: "輸入姿勢詞條...", items: ["坐在沙發", "靠牆", "被按在桌上", "跨坐", "跪姿", "趴伏", "雙腿打開", "從背後抱住", "手被抓住", "臉埋在肩窩", "腿纏上腰", "被抱起", "側躺", "騎乘"] },
    { key: "地點List", label: "地點", placeholder: "輸入地點詞條...", items: ["臥室", "客廳沙發", "廚房流理台", "餐桌", "浴室", "淋浴間", "玄關", "衣櫃前", "鏡子前", "學校／公務", "教室", "辦公室", "保健室", "更衣室", "倉庫", "停車場", "天台", "公共／刺激", "公廁隔間", "試衣間", "車後座", "電梯（短）", "公園角落", "賓館"] },
    { key: "性愛姿勢List", label: "性愛姿勢", placeholder: "輸入性愛姿勢詞條...", items: ["老漢推車", "傳教士", "騎乘", "反騎乘", "側入", "站立抱起", "抬腿", "靠牆後入", "坐位插入", "彎腰後入", "口交", "深喉", "舔陰", "乳交", "手交", "足交", "腿交", "指交"] },
    { key: "調教List", label: "調教", placeholder: "輸入調教詞條...", items: ["強制展示", "鏡子前展示", "雙腿打開給看", "胸貼近給看", "女體盛", "當桌子／餐盤", "當腳凳", "當椅墊", "一動不動當傢俱", "用身體擺姿勢拍照", "項圈牽繩", "四足爬行", "遛狗", "爬行跟在腳邊", "搖屁股", "舔手／舔鞋雙手銬背後", "腳踝分開固定", "全身繩縛", "跪姿綁住", "吊起來（輕）", "眼罩＋口塞", "乳夾拉著走", "用領帶／絲巾固定在椅上口交侍奉"] },
    { key: "mindList", label: "心理", placeholder: "輸入心理狀態詞條...", items: ["害羞閃躲", "表面冷淡內心動搖", "警惕防備", "期待又緊張", "順從"] }
  ],
  buttonPosition: { right: "18px", bottom: "110px", left: "auto", top: "auto" }
};

let selectedState = {};
let isDeleteMode = false;

function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  
  if (extension_settings[extensionName].globalPrompt === undefined) {
    extension_settings[extensionName].globalPrompt = defaultSettings.globalPrompt;
  }

  if (!Array.isArray(extension_settings[extensionName].categories)) {
    extension_settings[extensionName].categories = JSON.parse(JSON.stringify(defaultSettings.categories));
  }

  extension_settings[extensionName].categories.forEach(cat => {
    if (!selectedState[cat.key]) {
      selectedState[cat.key] = new Set();
    }
  });
}

// 根據勾選狀態與全局 Prompt 生成最終組合文本
function buildOutputText() {
  loadSettings();
  const globalPrompt = extension_settings[extensionName].globalPrompt || "";
  const categories = extension_settings[extensionName].categories || [];
  
  const lines = categories.map(cat => {
    const picked = Array.from(selectedState[cat.key] || []);
    return `${cat.label}：${picked.join("、")}`;
  });

  const stateText = `「${lines.join("\n")}」`;
  
  // 如果有設定全局 Prompt，則自動拼在最前方或最上方
  if (globalPrompt.trim()) {
    return `${globalPrompt.trim()}\n${stateText}`;
  }
  return stateText;
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
  if ($("#rp_picker_float_btn").length > 0) return;

  loadSettings();
  const savedPos = extension_settings[extensionName].buttonPosition || { right: "18px", bottom: "110px" };
  
  const btnHtml = `
    <div id="rp_picker_float_btn" title="按住可拖拽位置，點擊打開">
      👗 狀態模板
    </div>
  `;
  $("body").append(btnHtml);
  
  const $btn =$("#rp_picker_float_btn");
  if (savedPos.left && savedPos.left !== "auto") {
    $btn.css({ left: savedPos.left, top: savedPos.top, right: "auto", bottom: "auto" });
  } else {
    $btn.css({ right: savedPos.right, bottom: savedPos.bottom, left: "auto", top: "auto" });
  }

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

  function onTouchEnd() {
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
      renderCategories();
      // 回填當前的全局 Prompt 輸入框數值
      $("#rp_global_prompt_input").val(extension_settings[extensionName].globalPrompt || "");
      updatePreview();
      $("#rp_picker_modal").fadeIn(150);
    }
  }

  el.addEventListener("mousedown", onTouchStart);
  el.addEventListener("touchstart", onTouchStart, { passive: true });

  // 彈出式視窗 Modal（在頂部加入「全局固定 Prompt」設定行）
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
          <div class="rp-modal-content">
            <!-- 新增的全局固定 Prompt 輸入行 -->
            <div class="rp-global-prompt-block">
              <label class="rp-block-title">固定 Prompt（每次自動帶入）：</label>
              <textarea id="rp_global_prompt_input" rows="2" placeholder="輸入每次按下確定時都要自動帶入的全局指令..."></textarea>
            </div>
            <div id="rp_picker_categories"></div>
          </div>
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

  // 監聽全局 Prompt 輸入變化並自動保存
  $(document).off("input", "#rp_global_prompt_input").on("input", "#rp_global_prompt_input", function() {
    extension_settings[extensionName].globalPrompt = $(this).val();
    saveSettingsDebounced();
    updatePreview();
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
      saveSettingsDebounced();
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
}

jQuery(async () => {
  loadSettings();
  initPluginUI();
});
