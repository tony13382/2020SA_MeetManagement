/*
$(document).ready(function(){
	$('.host select').selectpicker();
})
*/
if ($(".searchSelect").length > 0){
	$(".searchSelect").select2({
		language: 'zh-TW',
		// 最多字元限制
		maximumInputLength: 10,
		// 最少字元才觸發尋找, 0 不指定
		minimumInputLength: 0,
		// 當找不到可以使用輸入的文字
		tags: false,
	});
};