"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../lib/auth");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
async function login(req, res) {
    const data = loginSchema.parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await (0, auth_1.comparePassword)(data.password, user.passwordHash))) {
        return res.status(401).json({ message: "E-mail ou senha inválidos." });
    }
    const token = (0, auth_1.signToken)({ sub: user.id, role: user.role, name: user.name });
    return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
}
