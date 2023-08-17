import { ConfigService} from "./config/config.service";
import {Composer, Markup, Scenes, session, Telegraf, Context} from 'telegraf';
import {SessionService} from "./config/session.service";



interface MyWizardSession extends Scenes.WizardSessionData {
    // will be available under `ctx.scene.session.myWizardSessionProp`
    myWizardSessionProp: number;
    nickName: string;
    birthday: string;
    cronEnable: boolean;
}

/**
 * We can still extend the regular session object that we can use on the
 * context. However, as we're using wizards, we have to make it extend
 * `WizardSession`.
 *
 * It is possible to pass a type variable to `WizardSession` if you also want to
 * extend the wizard session as we do above.
 */
interface MySession extends Scenes.WizardSession<MyWizardSession> {
    // will be available under `ctx.session.mySessionProp`
    mySessionProp: number;
}


interface MyContext extends Context {
    // will be available under `ctx.myContextProp`
    myContextProp: string;

    // declare session type
    session: MySession;
    // declare scene type
    scene: Scenes.SceneContextScene<MyContext, MyWizardSession>;
    // declare wizard type
    wizard: Scenes.WizardContextWizard<MyContext>;
}

export enum CommandEnum {
    addBirthdayFriend = '🔍 Добавить день рождение друга',
    findFriendBirthday = '🔍 Найти день рождение друга',
    showFriendsBirthdays = '🔍 Показать дни рождения"',
    settings = '☸ Setting',
}
export class Bot {
    private bot!: Telegraf<any>;

    constructor(
        private readonly configService: ConfigService,
        private readonly sessionService: SessionService
    ) {}

    init(): void {
        const tg_token = this.configService.get('TELEGRAM_TOKEN');
        this.bot = new Telegraf<any>(tg_token);
        this.bot.use(this.sessionService.init());
        this.bot.use(Telegraf.log());

/*
        this.bot.command("onetime", ctx =>
            ctx.reply(
                "One time keyboard",
                Markup.keyboard(["/simple", "/inline", "/pyramid"]).oneTime().resize(),
            ),
        );
*/

        this.bot.command("custom", async ctx => {
            return await ctx.reply(
                "Lets work",
                Markup.keyboard([
                    [CommandEnum.addBirthdayFriend], // Row1 with 2 buttons
                    [CommandEnum.findFriendBirthday],
                    [CommandEnum.showFriendsBirthdays],
                    [CommandEnum.settings], // Row2 with 2 buttons
                ])
                    .oneTime()
                    .resize(),
            );
        });

        const superWizard = new Scenes.WizardScene<MyContext>(
            "super-wizard",
            async ctx => {
                await ctx.reply("Ник вашего друга");
                return ctx.wizard.next();
            },
            async ctx => {
                await ctx.reply("Введите день рождение в формате DD.MM.YYYY");
                ctx.scene.session.nickName = (ctx.message as any)?.text;
                return ctx.wizard.next();
            },
            // stepHandler,
            async ctx => {
                const regBirthday = /\d{2}(-|\/|\.)\d{2}(-|\||\.)\d{4}/gim;
                const msgBirthday = (ctx.message as any)?.text;
                if (!regBirthday.test(msgBirthday)) {
                    await ctx.reply("Вы ввели не правильную дату. Попробуйте ещё раз");
                    return ctx.wizard.selectStep(ctx.wizard.cursor);
                }
                await ctx.reply("Напомнить в день рождение?");
                ctx.scene.session.birthday = msgBirthday;
                return ctx.wizard.next();
            },
            async ctx => {
                ctx.scene.session.cronEnable = (ctx.message as any)?.text;
                const answer = [
                    'Все верно?',
                    `Ник: ${ ctx.scene.session.nickName}`,
                    `День рождения: ${ ctx.scene.session.birthday}`,
                    `Напомнить в день рождения: ${ ctx.scene.session.cronEnable}`,
                ]
                await ctx.reply(answer.join('\n'));
                return ctx.wizard.next();
            },
            async ctx => {
                await ctx.reply("Done");
                return await ctx.scene.leave();
            },
        );

        // https://github.com/feathers-studio/telegraf-docs/blob/master/examples/wizards/wizard-with-custom-context-and-session-and-scene-session.ts
        // https://stackoverflow.com/questions/71895477/telegraf-js-how-to-pass-parameters-to-a-function-from-inline-keyboard
        this.bot.hears(CommandEnum.addBirthdayFriend, ctx => {
            return ctx.answerCbQuery(`enter-user-name-${ctx.match[0]}`)
            return ctx.reply(
                "Please enter friend Username"
            )
        });
        this.bot.action(/^enter-user-name-(\.+)$/, (ctx) => {
            return ctx.reply('YEAP');
        })
        this.bot.hears("📢 Ads", ctx => ctx.reply("Free hugs. Call now!"));

        this.bot.command("special", ctx => {
            return ctx.reply(
                "Special buttons keyboard",
                Markup.keyboard([
                    Markup.button.contactRequest("Send contact"),
                    Markup.button.locationRequest("Send location"),
                ]).resize(),
            );
        });

        this.bot.command("pyramid", ctx => {
            return ctx.reply(
                "Keyboard wrap",
                Markup.keyboard(["one", "two", "three", "four", "five", "six"], {
                    wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2,
                }),
            );
        });

        this.bot.command("simple", ctx => {
            return ctx.replyWithHTML(
                "<b>Coke</b> or <i>Pepsi?</i>",
                Markup.keyboard(["Coke", "Pepsi"]),
            );
        });

        this.bot.command("inline", ctx => {
            return ctx.reply("<b>Coke</b> or <i>Pepsi?</i>", {
                parse_mode: "HTML",
                ...Markup.inlineKeyboard([
                    Markup.button.callback("Coke", "Coke"),
                    Markup.button.callback("Pepsi", "Pepsi"),
                ]),
            });
        });

        this.bot.command("random", ctx => {
            return ctx.reply(
                "random example",
                Markup.inlineKeyboard([
                    Markup.button.callback("Coke", "Coke"),
                    Markup.button.callback("Dr Pepper", "Dr Pepper", Math.random() > 0.5),
                    Markup.button.callback("Pepsi", "Pepsi"),
                ]),
            );
        });

        const stage = new Scenes.Stage<MyContext>([superWizard], {
            default: "super-wizard",
        });

        this.bot.command("caption", ctx => {
            return ctx.replyWithPhoto(
                { url: "https://picsum.photos/200/300/?random" },
                {
                    caption: "Caption",
                    parse_mode: "Markdown",
                    ...Markup.inlineKeyboard([
                        Markup.button.callback("Plain", "plain"),
                        Markup.button.callback("Italic", "italic"),
                    ]),
                },
            );
        });

        this.bot.hears(/\/wrap (\d+)/, ctx => {
            return ctx.reply(
                "Keyboard wrap",
                Markup.keyboard(["one", "two", "three", "four", "five", "six"], {
                    columns: parseInt(ctx.match[1]),
                }),
            );
        });

        this.bot.action("Dr Pepper", (ctx, next) => {
            return ctx.reply("👍").then(() => next());
        });

        this.bot.action("plain", async ctx => {
            await ctx.answerCbQuery();
            await ctx.editMessageCaption(
                "Caption",
                Markup.inlineKeyboard([
                    Markup.button.callback("Plain", "plain"),
                    Markup.button.callback("Italic", "italic"),
                ]),
            );
        });




        this.bot.start((ctx) => {
  /*          ctx.session.counter = ctx.session.counter || 0
            ctx.session.counter++
            ctx.sessionDB.get('messages').push([ctx.message]).write()*/
            ctx.reply('Hi dear friend');
        })
        this.bot.use(stage.middleware());
        this.bot.catch(async (err, ctx) => {
            await ctx.reply('Something went wrong. Pls contact our developer')
        })
        this.bot.launch();
    }
}

const configService = new ConfigService();
const sessionService = new SessionService();
const bot = new Bot(configService, sessionService);

bot.init();
