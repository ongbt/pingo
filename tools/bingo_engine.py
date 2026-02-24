import random
import json

def generate_board(items, size=5):
    """
    Generates a randomized bingo board from a list of items.
    """
    if len(items) < size * size:
        raise ValueError(f"Need at least {size*size} items to generate a {size}x{size} board.")
    
    # Shuffle and pick the required number of items
    shuffled = random.sample(items, size * size)
    
    # Structure as 5x5 grid
    board = []
    for i in range(0, size * size, size):
        row = [{"value": val, "marked": False} for val in shuffled[i:i+size]]
        board.append(row)
    
    return board

def check_bingo(board):
    """
    Checks if the current board state has a winning bingo line.
    """
    size = len(board)
    
    # Check Rows
    for row in board:
        if all(cell["marked"] for cell in row):
            return True, "row"
            
    # Check Columns
    for col in range(size):
        if all(board[row][col]["marked"] for row in range(size)):
            return True, "column"
            
    # Check Diagonals
    if all(board[i][i]["marked"] for i in range(size)):
        return True, "diagonal_main"
        
    if all(board[i][size - 1 - i]["marked"] for i in range(size)):
        return True, "diagonal_alt"
        
    return False, None

if __name__ == "__main__":
    # Test logic
    test_items = [f"Item {i}" for i in range(30)]
    board = generate_board(test_items)
    print("Generated Board:")
    print(json.dumps(board, indent=2))
    
    # Simulate a win
    for i in range(5):
        board[0][i]["marked"] = True
    
    is_win, pattern = check_bingo(board)
    print(f"Bingo check: {is_win}, Pattern: {pattern}")
