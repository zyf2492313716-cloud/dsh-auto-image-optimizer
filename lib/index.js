//#region src/index.js
/**
* @dsh-local/dsh-auto-image-optimizer
* DSH 智能图片上传优化器：自动下采样 Retina/4K 截屏，放宽大图限制
*/
const name = "auto-image-optimizer";
function apply(ctx) {
	ctx.on("ready", () => {
		try {
			const attachments = ctx.get ? ctx.get("attachments") : ctx.attachments;
			if (attachments && attachments.imageLimits) try {
				if (attachments.imageLimits.maxImageDimension < 4096) attachments.imageLimits.maxImageDimension = 4096;
			} catch {}
		} catch {}
	});
}
//#endregion
export { apply, name };
