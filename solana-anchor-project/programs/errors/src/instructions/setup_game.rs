use anchor_lang::prelude::*;
use crate::state::game::*;

pub fn setup_game(ctx: Context<SetupGame>) -> Result<()> {
    ctx.accounts.game.start()
}

#[derive(Accounts)]
pub struct SetupGame<'info> {
    #[account(init, payer = player_one, space = Game::MAXIMUM_SIZE + 8)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player_one: Signer<'info>,
    pub system_program: Program<'info, System>,
}
