using PCSC;

namespace AccessControlPlatform.Services;

public class CardProvisioningService
{
    private readonly SemaphoreSlim _gate = new(1, 1);

    public async Task<string?> WaitForCardTapAsync(TimeSpan timeout, CancellationToken cancellationToken)
    {
        if (!await _gate.WaitAsync(0, cancellationToken))
            throw new InvalidOperationException("A card provisioning is already in progress.");

        try
        {
            using var ctx = ContextFactory.Instance.Establish(SCardScope.System);
            var readerName = ctx.GetReaders().FirstOrDefault(r => r.Contains("PICC", StringComparison.OrdinalIgnoreCase));
            if (readerName == null)
                return null;

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(timeout);

            while (!cts.IsCancellationRequested)
            {
                try
                {
                    using var reader = ctx.ConnectReader(readerName, SCardShareMode.Shared, SCardProtocol.Any);
                    var getUidCommand = new byte[] { 0xFF, 0xCA, 0x00, 0x00, 0x00 };
                    var response = new byte[16];
                    var received = reader.Transmit(getUidCommand, response);

                    if (received >= 4)
                    {
                        byte[] data = response.Take(received - 2).ToArray();
                        byte status1 = response[received - 2];
                        byte status2 = response[received - 1];

                        if (status1 == 0x90 && status2 == 0x00)
                            return BitConverter.ToString(data).Replace("-", "");
                    }
                }
                catch (PCSC.Exceptions.RemovedCardException) { }
                catch (PCSC.Exceptions.NoSmartcardException) { }
                catch (Exception) { }

                await Task.Delay(250, cts.Token);
            }

            return null;
        }
        catch (OperationCanceledException)
        {
            return null;
        }
        finally
        {
            _gate.Release();
        }
    }
}
