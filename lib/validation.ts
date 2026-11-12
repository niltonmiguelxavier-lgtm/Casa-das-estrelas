import { z } from "zod";

/**
 * Esquemas de validação usados no servidor (Server Actions / Route Handlers).
 * Nenhum destes esquemas deve ser considerado opcional: a validação no cliente
 * é apenas conveniência de UX.
 */

export const passwordSchema = z
  .string()
  .min(8, "A palavra-passe deve ter pelo menos 8 caracteres.")
  .max(128, "A palavra-passe é demasiado longa.")
  .regex(/[a-z]/, "Deve incluir pelo menos uma letra minúscula.")
  .regex(/[A-Z]/, "Deve incluir pelo menos uma letra maiúscula.")
  .regex(/[0-9]/, "Deve incluir pelo menos um número.");

export const phoneSchema = z
  .string()
  .trim()
  .min(9, "Número de telefone inválido.")
  .max(20, "Número de telefone inválido.")
  .regex(/^[+0-9\s()-]+$/, "Use apenas dígitos e os símbolos + ( ) -.");

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Indique o nome completo.")
      .max(120, "Nome demasiado longo.")
      .regex(/^[\p{L}\s'.-]+$/u, "O nome contém caracteres inválidos."),
    email: z.string().trim().toLowerCase().email("Endereço de email inválido."),
    phone: phoneSchema,
    country: z.enum(["Moçambique", "Angola", "Outros países"]),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: "É necessário aceitar os termos e condições." }),
    acceptPrivacy: z.literal(true, { message: "É necessário aceitar a política de privacidade." }),
    acceptMarketing: z.boolean().optional().default(false),
    // honeypot anti-bot: deve permanecer vazio
    website: z.string().max(0, "Pedido inválido.").optional().default(""),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Endereço de email inválido."),
  password: z.string().min(1, "Indique a palavra-passe."),
  next: z.string().optional(),
});

/** Definição de nova palavra-passe (após ligação de recuperação). */
export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Endereço de email inválido."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Ligação inválida."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  phone: phoneSchema.optional(),
  country: z.enum(["Moçambique", "Angola", "Outros países"]).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Indique a palavra-passe actual."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });

export const freeVoteSchema = z.object({
  participantId: z.string().uuid().or(z.string().min(1)),
  campaignId: z.string().uuid().or(z.string().min(1)),
  quantity: z.coerce.number().int().min(1).max(50).default(1),
});

export const createOrderSchema = z.object({
  participantId: z.string().min(1),
  packageId: z.string().min(1),
  method: z.enum(["mpesa", "emola", "mkesh", "visa", "mastercard"]),
});

export const notificationPreferencesSchema = z.object({
  inApp: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean(),
  whatsapp: z.boolean(),
  voteAlerts: z.boolean(),
  newsAlerts: z.boolean(),
  paymentAlerts: z.boolean(),
  securityAlerts: z.boolean(),
});

export const adminNewsSchema = z.object({
  title: z.string().trim().min(5).max(160),
  slug: z.string().trim().min(3).max(160).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().trim().min(10).max(320),
  body: z.string().trim().min(30),
  category: z.enum(["Comunicado", "Programa", "Eliminação", "Anúncio", "Imprensa"]),
  status: z.enum(["rascunho", "publicado", "agendado"]),
});

export const adminNotificationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(5).max(1000),
  category: z.enum(["conta", "votacao", "pagamento", "programa", "sistema"]),
  audience: z.enum(["todos", "pais", "selecionados", "votantes"]),
  country: z.enum(["Moçambique", "Angola", "Outros países"]).optional(),
  channels: z.array(z.enum(["in_app", "email", "push", "sms", "whatsapp"])).min(1),
  scheduledAt: z.string().optional(),
  confirm: z.literal(true),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
