using BC = BCrypt.Net.BCrypt;
Console.WriteLine(BC.HashPassword("Admin123!", workFactor: 11));
Console.WriteLine(BC.HashPassword("Dealer123!", workFactor: 11));
Console.WriteLine(BC.HashPassword("Client123!", workFactor: 11));
