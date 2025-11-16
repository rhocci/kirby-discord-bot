import dayjs from 'dayjs';

export function startHealthServer() {
	const port = process.env.PORT || 8000;

	Bun.serve({
		port,
		fetch(req) {
			const url = new URL(req.url);

			if (url.pathname === '/health') {
				return new Response('OK', { status: 200 });
			}

			return new Response('Not Found', { status: 404 });
		},
	});

	console.log('헬스체크 서버 가동 중: 8000');
	console.log('현재 서버 시간:', new Date().toString());
	console.log('Dayjs 시간:', dayjs().format('YYYY-MM-DD HH:mm:ss Z'));
}
